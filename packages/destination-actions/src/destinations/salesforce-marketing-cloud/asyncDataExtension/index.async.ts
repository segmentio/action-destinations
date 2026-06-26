import {
  MultiStatusResponse,
  AsyncActionDefinition,
  AsyncBatchResponse,
  IntegrationError,
  PollResponse,
  HTTPError
} from '@segment/actions-core'
import { asyncUpsertRowsV2 } from '../sfmc-operations'
import { fields, dynamicFields, hooks } from './fields'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type AsyncUpsertRowsPollResultMessage = {
  resultType: string
  resultClass: string
  resultCode: string
  message: string
}

type AsyncUpsertRowsjobStatusResponse = {
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

type GenericAPIErrorResponse = {
  documentation: string
  errorcode: number
  message: string
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

      // Set Job ID and HTTP status from API response
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
      else if ((asyncUpsertResponse.data as unknown as GenericAPIErrorResponse).message) {
        for (let i = 0; i < payload.length; i++) {
          response.multiStatusResponse.setErrorResponseAtIndex(i, {
            status: asyncUpsertResponse.status,
            errormessage: (asyncUpsertResponse.data as unknown as GenericAPIErrorResponse).message,
            sent: JSON.stringify(payload[i]),
            body: asyncUpsertResponse.data as unknown as GenericAPIErrorResponse
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
    } catch (error) {
      // Throw a generic non-retryable integration error for non HTTPError types
      throw new IntegrationError(`Failed to upsert rows asynchronously: ${error.message}`, 'BAD_REQUEST', 400)
    }

    return response
  },

  performPoll: async (request, { settings, payload }) => {
    const response: PollResponse = {
      jobId: payload.jobId,
      status: 200,
      jobStatus: 'IN_PROGRESS'
    }

    try {
      const statusResponse = await request<AsyncUpsertRowsjobStatusResponse>(
        `https://${settings.subdomain}.rest.marketingcloudapis.com/data/v1/async/${payload.jobId}/status`,
        {
          method: 'GET'
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
        return response
      }

      // If the control reaches here, it means the request is complete but has errors
      // Fetch the results to get the granular error messages for failed records
      response.jobStatus = 'SUCCEEDED'
      response.multiStatusResponse = new MultiStatusResponse()

      const resultsResponse = await request<AsyncUpsertRowsPollResultsResponse>(
        `https://${settings.subdomain}.rest.marketingcloudapis.com/data/v1/async/${payload.jobId}/results`,
        {
          method: 'GET'
        }
      )

      for (let i = 0; i < resultsResponse.data.items.length; i++) {
        // If an individual record has an 'OK' status, consider it a success, otherwise consider it a failure and set the error message from the API response
        if (resultsResponse.data.items[i].status === 'OK') {
          response.multiStatusResponse.setSuccessResponseAtIndex(i, {
            status: 200,
            sent: {},
            body: 'OK'
          })
        } else {
          response.multiStatusResponse.setErrorResponseAtIndex(i, {
            status: 400,
            errormessage: resultsResponse.data.items[i].message,
            body: {}
          })
        }
      }

      return response
    } catch (error) {
      if (!(error instanceof HTTPError)) {
        response.status = 400
        response.jobStatus = 'FAILED'
        return response
      }

      // For 429 or 500 errors, set jobStatus to IN_PROGRESS as these errors typically indicate a temporary issue on SFMC's end
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
