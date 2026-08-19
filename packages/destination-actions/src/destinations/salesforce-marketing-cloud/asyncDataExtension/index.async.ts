import {
  MultiStatusResponse,
  AsyncActionDefinition,
  AsyncBatchResponse,
  IntegrationError,
  APIError,
  RetryableError,
  PollResponse,
  HTTPError,
  JSONLikeObject
} from '@segment/actions-core'
import { asyncUpsertRowsV2, isAsyncUpsertRowsV2ErrorResponse } from '../sfmc-operations'
import { fields, dynamicFields, hooks } from './fields'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type AsyncUpsertRowsPollResultMessage = {
  resultType: string
  resultClass: string
  resultCode: string
  message: string
}

// SFMC reports SQL deadlocks (transient - retrying the same row will likely succeed) under the
// same generic errorCode as permanent validation failures, but always ends the message this way.
const RETRYABLE_ROW_ERROR_SUFFIX = 'Rerun the transaction.'

type AsyncUpsertRowsJobStatusResponse = {
  status: {
    callDateTime: string
    completionDateTime: string
    hasErrors: boolean
    pickupDateTime: string
    requestStatus: 'Complete' | 'Error' | 'Executing' | 'Pending'
    resultStatus: 'OK' | 'Has Errors'
    requestId: string
  }
  requestId: string
  resultMessages: AsyncUpsertRowsPollResultMessage[]
}

type AsyncUpsertRowsPollResultsResponse = {
  page: number
  pageSize: number
  count: number
  items: {
    errorCode?: number
    message: string
    status: 'OK' | 'Error'
  }[]
  requestId: string
  resultMessages: AsyncUpsertRowsPollResultMessage[]
}

const asyncAction: AsyncActionDefinition<Settings, Payload> = {
  title: 'Send Event asynchronously to Data Extension',
  description: `Upsert event records asynchronously as rows into a data extension in Salesforce Marketing Cloud.`,
  fields,
  dynamicFields,
  hooks,

  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const response: AsyncBatchResponse = {
      multiStatusResponse: new MultiStatusResponse(),
      jobId: undefined,
      status: 200
    }

    const dataExtensionId: string =
      hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    if (!dataExtensionId) {
      throw new IntegrationError('No Data Extension Connected', 'INVALID_CONFIGURATION', 400)
    }

    try {
      const asyncUpsertResponse = await asyncUpsertRowsV2(request, settings.subdomain, payload, dataExtensionId, false)

      // Surface whatever requestId SFMC returns, regardless of HTTP status - SFMC can assign a
      // requestId even on a rejected submission (e.g. a 400 with row-level validation messages),
      // and callers rely on seeing it when present.
      response.jobId = asyncUpsertResponse.data.requestId
      response.status = asyncUpsertResponse.status

      // No HTTP errors, consider all rows as accepted for processing by SFMC
      if (asyncUpsertResponse.ok) {
        // Set MultiStatus Response as success
        for (let i = 0; i < payload.length; i++) {
          response.multiStatusResponse.setSuccessResponseAtIndex(i, {
            status: 200,
            sent: JSON.stringify(payload[i]),
            body: {}
          })
        }
        return response
      }
      // Handle batch level errors where the entire batch is rejected due to an error (401, 403, 500, etc)
      else if (isAsyncUpsertRowsV2ErrorResponse(asyncUpsertResponse.data)) {
        for (let i = 0; i < payload.length; i++) {
          response.multiStatusResponse.setErrorResponseAtIndex(i, {
            status: asyncUpsertResponse.status,
            errormessage: asyncUpsertResponse.data.message,
            sent: JSON.stringify(payload[i]),
            body: asyncUpsertResponse.data as Object as JSONLikeObject
          })
        }

        return response
      }
      // For other errors, check if SFMC returned any result messages in the response body
      else if (asyncUpsertResponse.data.resultMessages && asyncUpsertResponse.data.resultMessages.length > 0) {
        for (let i = 0; i < payload.length; i++) {
          response.multiStatusResponse.setErrorResponseAtIndex(i, {
            status: asyncUpsertResponse.status,
            errormessage: asyncUpsertResponse?.data?.resultMessages[0]?.message ?? 'Unknown error',
            sent: JSON.stringify(payload[i]),
            body: {}
          })
        }

        return response
      } else {
        // If no result messages are returned in the response body, surface the real HTTP status code
        const errormessage = `SFMC API responded with ${JSON.stringify(asyncUpsertResponse.data)}.`
        for (let i = 0; i < payload.length; i++) {
          response.multiStatusResponse.setErrorResponseAtIndex(i, {
            status: asyncUpsertResponse.status,
            errormessage,
            sent: JSON.stringify(payload[i]),
            body: {}
          })
        }
        return response
      }
    } catch (error: unknown) {
      // Preserve the upstream status so 429/5xx get retried and other 4xx don't.
      if (error instanceof HTTPError) {
        const status = error.response?.status ?? 500
        throw new APIError(`Failed to upsert rows asynchronously: ${error.message}`, status)
      }

      // Network-level failures (timeouts, connection resets, DNS issues) are transient - retry them.
      const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined
      const isRetryableNetworkError =
        code === 'ETIMEDOUT' ||
        code === 'ECONNRESET' ||
        code === 'ECONNREFUSED' ||
        code === 'EAI_AGAIN' ||
        code === 'ENOTFOUND'
      if (isRetryableNetworkError) {
        throw new RetryableError(`Failed to upsert rows asynchronously: ${(error as Error).message}`)
      }

      // Anything else (unexpected/unclassified errors) is treated as non-retryable to avoid
      // retrying deterministic bugs indefinitely.
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new IntegrationError(`Failed to upsert rows asynchronously: ${message}`, 'BAD_REQUEST', 400)
    }
  },

  performPoll: async (request, { settings, payload }) => {
    const response: PollResponse = {
      jobId: payload.jobId,
      status: 200,
      jobStatus: 'IN_PROGRESS'
    }

    try {
      const statusResponse = await request<AsyncUpsertRowsJobStatusResponse>(
        `https://${settings.subdomain}.rest.marketingcloudapis.com/data/v1/async/${payload.jobId}/status`,
        {
          method: 'GET',
          // resultMessages is unbounded, so this response can cross the same clone-tee
          // threshold as /results below and deadlock identically.
          skipResponseCloning: true
        }
      )

      // Set HTTP status from API response
      response.status = statusResponse.status

      // If the status object is not present in the response, this typically indicates an operation failure, eg: AsyncRequestStatusNotFound
      if (!statusResponse.data.status) {
        response.jobStatus = 'FAILED'
        return response
      }

      // Return IN_PROGRESS status if SFMC indicates that the request is still being processed
      if (
        statusResponse.data.status.requestStatus === 'Pending' ||
        statusResponse.data.status.requestStatus === 'Executing'
      ) {
        response.jobStatus = 'IN_PROGRESS'
        return response
      }

      // Return FAILED status if SFMC indicates that the request has failed
      if (statusResponse.data.status.requestStatus === 'Error') {
        response.jobStatus = 'FAILED'
        return response
      }

      // Check if the request is complete without any errors
      if (statusResponse.data.status.requestStatus === 'Complete' && statusResponse.data.status.resultStatus === 'OK') {
        response.jobStatus = 'SUCCEEDED'

        // The lightweight status API confirms every uploaded record succeeded, so we avoid calling
        // the heavyweight results API. Report the success count using the uploadCount passed into the poll.
        response.multiStatusResponse = new MultiStatusResponse()
        for (let i = 0; i < payload.uploadCount; i++) {
          response.multiStatusResponse.setSuccessResponseAtIndex(i, {
            status: 200,
            sent: {},
            body: 'OK'
          })
        }

        return response
      }

      // If the control reaches here, it means the request is complete but has errors
      // Fetch the results to get the granular error messages for failed records
      response.multiStatusResponse = new MultiStatusResponse()

      const resultsResponse = await request<AsyncUpsertRowsPollResultsResponse>(
        `https://${settings.subdomain}.rest.marketingcloudapis.com/data/v1/async/${payload.jobId}/results`,
        {
          method: 'GET',
          // The results payload carries one item per uploaded record (both 'OK' and 'Error'
          // entries, in submission order), and routinely exceeds the 16KB highWaterMark of the
          // tee that `response.clone()` sets up in prepare-response.
          // Reading only the clone while the original body goes unread deadlocks that tee, so
          // the request never settles and the caller's poll deadline expires instead. Same fix
          // and same root cause as the Iterable Lists hang (PR #2461).
          skipResponseCloning: true
        }
      )

      let successCount = 0
      for (let i = 0; i < resultsResponse.data.items.length; i++) {
        // If an individual record has an 'OK' status, consider it a success, otherwise consider it a failure and set the error message from the API response
        if (resultsResponse.data.items[i].status === 'OK') {
          successCount++
          response.multiStatusResponse.setSuccessResponseAtIndex(i, {
            status: 200,
            sent: {},
            body: 'OK'
          })
        } else {
          const errormessage = resultsResponse.data.items[i].message
          // errorCode 2 is a generic SFMC bucket covering both permanent validation failures and
          // transient SQL deadlocks - use the message text to flag deadlocked rows as retryable.
          const isRetryableRowError = errormessage.endsWith(RETRYABLE_ROW_ERROR_SUFFIX)
          response.multiStatusResponse.setErrorResponseAtIndex(i, {
            status: isRetryableRowError ? 429 : 400,
            errormessage,
            body: {}
          })
        }
      }

      // Only report SUCCEEDED if at least one record actually succeeded --
      // otherwise this contradicts a success_count of 0 downstream.
      response.jobStatus = successCount > 0 ? 'SUCCEEDED' : 'FAILED'

      return response
    } catch (error) {
      if (!(error instanceof HTTPError)) {
        response.status = 400
        response.jobStatus = 'FAILED'
        return response
      }

      // For 429 or 500 errors, set jobStatus to RETRYABLE_ERROR as these errors typically indicate a temporary issue on SFMC's end
      if (error.response.status === 429 || error.response.status === 500) {
        response.status = error.response.status
        response.jobStatus = 'RETRYABLE_ERROR'
        return response
      }

      // For other HTTP errors, set jobStatus to FAILED
      response.status = error.response.status
      response.jobStatus = 'FAILED'
      return response
    }
  }
}

export default asyncAction
