import {
  MultiStatusResponse,
  AsyncActionDefinition,
  AsyncBatchResponse,
  IntegrationError,
  APIError,
  RetryableError,
  PollResponse,
  HTTPError,
  NetworkError,
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
// same generic errorCode as permanent validation failures, but the message text always
// contains this phrase. Match with a tolerant substring check (not a strict endsWith) so
// trailing whitespace or minor message variations don't cause a false negative.
const RETRYABLE_ROW_ERROR_PHRASE = 'Rerun the transaction'

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
        for (let i = 0; i < payload.length; i++) {
          response.multiStatusResponse.setSuccessResponseAtIndex(i, {
            status: 200,
            sent: JSON.stringify(payload[i]),
            body: {}
          })
        }
        return response
      }

      // Every remaining case is a batch-level rejection (401/403/500/etc, a validation
      // resultMessages body, or an unrecognized shape) -- same per-row error treatment
      // either way, differing only in the message/body sourced from the response.
      const { errormessage, body } = isAsyncUpsertRowsV2ErrorResponse(asyncUpsertResponse.data)
        ? { errormessage: asyncUpsertResponse.data.message, body: asyncUpsertResponse.data as Object as JSONLikeObject }
        : asyncUpsertResponse.data.resultMessages && asyncUpsertResponse.data.resultMessages.length > 0
        ? { errormessage: asyncUpsertResponse.data.resultMessages[0]?.message ?? 'Unknown error', body: {} }
        : { errormessage: `SFMC API responded with ${JSON.stringify(asyncUpsertResponse.data)}.`, body: {} }

      for (let i = 0; i < payload.length; i++) {
        response.multiStatusResponse.setErrorResponseAtIndex(i, {
          status: asyncUpsertResponse.status,
          errormessage,
          sent: JSON.stringify(payload[i]),
          body
        })
      }
      return response
    } catch (error: unknown) {
      // Preserve the upstream status so 429/5xx get retried and other 4xx don't.
      if (error instanceof HTTPError) {
        const status = error.response?.status ?? 500
        throw new APIError(`Failed to upsert rows asynchronously: ${error.message}`, status)
      }

      // Network-level failures (timeouts, connection resets, DNS issues) are transient - retry
      // them. The request client itself already classifies these into NetworkError, so there's
      // no Node error-code list to maintain here.
      if (error instanceof NetworkError) {
        throw new RetryableError(`Failed to upsert rows asynchronously: ${error.message}`)
      }

      // Anything else (unexpected/unclassified errors) is treated as non-retryable to avoid
      // retrying deterministic bugs indefinitely.
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new IntegrationError(`Failed to upsert rows asynchronously: ${message}`, 'BAD_REQUEST', 400)
    }
  },

  performPoll: async (request, { settings, payload, logger }) => {
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

      // The status object can be absent either because the job is genuinely unknown/expired,
      // or because it hasn't been picked up for processing yet (a normal, transient, pre-pickup
      // state) -- confirmed by observing this exact response shape for a job that later completed
      // with 100% success. We can't tell the two apart from this response alone, so treat it as
      // retryable rather than a terminal failure -- a job that's truly gone will keep hitting this
      // on every retry and eventually be handled by the caller's own retry/backoff limits, while a
      // job that just hasn't started avoids being falsely reported as FAILED.
      if (!statusResponse.data.status) {
        logger?.warn?.(
          `SFMC async status response missing status object for job ${payload.jobId}: ${JSON.stringify(
            statusResponse.data
          )}`
        )
        response.jobStatus = 'RETRYABLE_ERROR'
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

        // SFMC's own documented reason for the failure lives in resultMessages -- surface it
        // instead of leaving the caller with a bare FAILED and no explanation. There's no
        // per-row detail at this stage (the job never got far enough for one), so report the
        // same message across every uploaded record, mirroring the SUCCEEDED-without-/results
        // branch below.
        const errormessage = statusResponse.data.resultMessages?.[0]?.message ?? 'SFMC reported the request as failed'
        response.multiStatusResponse = new MultiStatusResponse()
        for (let i = 0; i < payload.uploadCount; i++) {
          response.multiStatusResponse.setErrorResponseAtIndex(i, {
            status: response.status,
            errormessage,
            body: {}
          })
        }

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

      // The only remaining requestStatus/resultStatus combination is Complete + Has Errors
      // (Pending/Executing/Error/Complete+OK all returned above) -- fetch the results to get
      // the granular error messages for failed records.
      const statusHasErrors = statusResponse.data.status?.resultStatus === 'Has Errors'
      response.multiStatusResponse = new MultiStatusResponse()

      // /results is paginated (50 items per page by default) -- fetch every page up front so
      // `count` (the true total) is fully represented in `items` before we decide successCount/
      // jobStatus. Without this, any batch over one page's worth of rows would silently report
      // results for only the first page.
      const items: AsyncUpsertRowsPollResultsResponse['items'] = []
      let page = 1
      let totalCount = 0
      let pageSize = 0
      for (;;) {
        const resultsResponse = await request<AsyncUpsertRowsPollResultsResponse>(
          `https://${settings.subdomain}.rest.marketingcloudapis.com/data/v1/async/${payload.jobId}/results?page=${page}`,
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

        items.push(...(resultsResponse.data.items ?? []))
        totalCount = resultsResponse.data.count ?? items.length
        pageSize = resultsResponse.data.pageSize || pageSize

        if (!pageSize || items.length >= totalCount) {
          break
        }
        page++
      }

      // SFMC's /status can report hasErrors on a job whose /results page(s) come back with zero
      // (or a missing) items -- a status/results inconsistency, not proof the job actually
      // failed. Since we have no per-record detail to act on, treat it as retryable rather than
      // a hard FAILED with no explanation. Gated explicitly on statusHasErrors (not just the
      // empty/missing items check) so this can't misfire if this block is ever reached outside
      // the Complete+Has Errors path in a future refactor.
      if (statusHasErrors && items.length === 0) {
        logger?.warn?.(`SFMC async /status reported errors for job ${payload.jobId} but /results returned no items`)
        delete response.multiStatusResponse
        response.jobStatus = 'RETRYABLE_ERROR'
        return response
      }

      let successCount = 0
      for (let i = 0; i < items.length; i++) {
        // If an individual record has an 'OK' status, consider it a success, otherwise consider it a failure and set the error message from the API response
        if (items[i].status === 'OK') {
          successCount++
          response.multiStatusResponse.setSuccessResponseAtIndex(i, {
            status: 200,
            sent: {},
            body: 'OK'
          })
        } else {
          const errormessage = items[i].message
          // errorCode 2 is a generic SFMC bucket covering both permanent validation failures and
          // transient SQL deadlocks - use the message text to flag deadlocked rows as retryable.
          const isRetryableRowError = errormessage.trim().includes(RETRYABLE_ROW_ERROR_PHRASE)
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
      // The /results call above may have thrown after response.multiStatusResponse was already
      // initialized to an empty (but truthy) instance -- discard it so callers don't mistake
      // "we never got any per-record data" for a real, if empty, multi-status result.
      delete response.multiStatusResponse

      if (!(error instanceof HTTPError)) {
        // Network-level failures (timeouts, connection resets, DNS issues) are transient -- the
        // job itself may be fine (confirmed in production: a poll that hit one of these mid-flight
        // for a job that had already completed successfully). The request client itself already
        // classifies these into NetworkError, so there's no Node error-code list to maintain here
        // -- mirrors the same classification performBatch relies on.
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger?.warn?.(`SFMC async poll failed for job ${payload.jobId} with a non-HTTP error: ${message}`)

        response.status = 400
        response.jobStatus = error instanceof NetworkError ? 'RETRYABLE_ERROR' : 'FAILED'
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
