import {
  MultiStatusResponse,
  AsyncActionDefinition,
  AsyncBatchResponse,
  IntegrationError,
  PollResponse,
  HTTPError,
  isRetryableNetworkError,
  JSONLikeObject,
  RequestClient
} from '@segment/actions-core'
import { asyncUpsertRowsV2, isAsyncUpsertRowsV2ErrorResponse } from '../sfmc-operations'
import type { AsyncUpsertRowsV2Response } from '../sfmc-operations'
import { fields, dynamicFields, hooks } from './fields'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type AsyncUpsertRowsPollResultMessage = {
  resultType: string
  resultClass: string
  resultCode: string
  message: string
}

// SFMC reports SQL deadlocks (transient - SFMC lands the row on its own internal retry) under
// the same generic errorCode as permanent validation failures, but the deadlock message always
// contains this phrase. Match with a tolerant substring check (not a strict endsWith) so
// trailing whitespace or minor message variations don't cause a false negative.
const TRANSIENT_ROW_ERROR_PHRASE = 'Rerun the transaction'

// When an async submit is rejected (non-2xx), SFMC returns one of three response shapes that
// differ only in where the error message lives. This resolves the {errormessage, body} to apply
// to every row, so performBatch can use a single error loop instead of three near-identical ones.
function resolveBatchErrorDetail(data: AsyncUpsertRowsV2Response): { errormessage: string; body: JSONLikeObject } {
  // 1. Batch-level error (401/403/500): a top-level `message`.
  if (isAsyncUpsertRowsV2ErrorResponse(data)) {
    return { errormessage: data.message, body: data as Object as JSONLikeObject }
  }
  // 2. Validation error (400): messages live in a `resultMessages[]` array.
  if (data.resultMessages && data.resultMessages.length > 0) {
    return { errormessage: data.resultMessages[0]?.message ?? 'Unknown error', body: {} }
  }
  // 3. Unrecognized shape: surface the raw response so it isn't lost.
  return { errormessage: `SFMC API responded with ${JSON.stringify(data)}.`, body: {} }
}

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

type PollResultItems = AsyncUpsertRowsPollResultsResponse['items']

/**
 * Fetches every page of a job's `/results`. SFMC paginates at 50 items/page by default and
 * `count` is the true total, so we must walk all pages -- reading only page 1 would silently
 * under-report results for any batch larger than one page.
 *
 * `skipResponseCloning` avoids a clone-tee deadlock: the results body carries one item per
 * uploaded record and routinely exceeds the 16KB highWaterMark of the tee that
 * `response.clone()` sets up in prepare-response; reading only the clone deadlocks it and the
 * request never settles (same root cause/fix as the Iterable Lists hang, PR #2461).
 */
async function fetchAllResultItems(request: RequestClient, subdomain: string, jobId: string): Promise<PollResultItems> {
  const items: PollResultItems = []
  let page = 1
  let totalCount = 0
  let pageSize = 0

  for (;;) {
    const resultsResponse = await request<AsyncUpsertRowsPollResultsResponse>(
      `https://${subdomain}.rest.marketingcloudapis.com/data/v1/async/${jobId}/results?page=${page}`,
      { method: 'GET', skipResponseCloning: true }
    )

    items.push(...(resultsResponse.data.items ?? []))
    totalCount = resultsResponse.data.count ?? items.length
    pageSize = resultsResponse.data.pageSize || pageSize

    if (!pageSize || items.length >= totalCount) {
      break
    }
    page++
  }

  return items
}

/**
 * Populates `multiStatusResponse` from the per-row `/results` items and returns the tallies.
 * Row classification:
 *  - `OK`                        -> success
 *  - transient SQL deadlock      -> counted as DELIVERED (success), not a failure. SFMC's async
 *                                   framework lands these on its own internal retry -- confirmed
 *                                   in production (a 500k sync had every row in the data extension
 *                                   while /results still reported ~7.9% as deadlock errors).
 *                                   Folding them into the failure count over-reports drops for
 *                                   rows that actually delivered (surfaces downstream as granobs
 *                                   REASON_MESSAGE_REJECTED). See workspace/manual-todo.md #1 --
 *                                   this rests on SFMC always landing deadlock rows; a Complete
 *                                   async job is immutable so re-polling can't re-drive them.
 *  - any other error             -> genuine terminal per-row failure (400).
 */
function applyResultItems(
  multiStatusResponse: MultiStatusResponse,
  items: PollResultItems
): { successCount: number; recoveredTransientCount: number; permanentErrorCount: number } {
  let successCount = 0
  let recoveredTransientCount = 0
  let permanentErrorCount = 0

  for (let i = 0; i < items.length; i++) {
    if (items[i].status === 'OK') {
      successCount++
      multiStatusResponse.setSuccessResponseAtIndex(i, { status: 200, sent: {}, body: 'OK' })
      continue
    }

    const errormessage = items[i].message
    // Substring match anywhere in the message -- inherently tolerant of leading/trailing
    // whitespace and surrounding text, so no trim/normalization is needed here.
    const isTransientRowError = errormessage.includes(TRANSIENT_ROW_ERROR_PHRASE)

    if (isTransientRowError) {
      recoveredTransientCount++
      multiStatusResponse.setSuccessResponseAtIndex(i, {
        status: 200,
        sent: {},
        body: 'OK (row reported a transient SFMC deadlock; SFMC lands these on internal retry)'
      })
    } else {
      permanentErrorCount++
      multiStatusResponse.setErrorResponseAtIndex(i, { status: 400, errormessage, body: {} })
    }
  }

  return { successCount, recoveredTransientCount, permanentErrorCount }
}

const asyncAction: AsyncActionDefinition<Settings, Payload> = {
  title: 'Send Event asynchronously to Data Extension',
  description: `Upsert event records asynchronously as rows into a data extension in Salesforce Marketing Cloud.`,
  fields,
  dynamicFields,
  hooks,

  performBatch: async (request, { settings, payload, hookOutputs, logger }) => {
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

    // No error handling here on purpose: the async framework (executeBatch) classifies anything
    // thrown from performBatch -- an HTTPError keeps its status, a transient network failure
    // becomes retryable, and any other unexpected error becomes a terminal, non-retryable 400.
    // So we just let errors propagate rather than re-classifying them per-destination.
    const asyncUpsertResponse = await asyncUpsertRowsV2(request, settings.subdomain, payload, dataExtensionId, false)

    // Surface whatever requestId SFMC returns, regardless of HTTP status - SFMC can assign a
    // requestId even on a rejected submission (e.g. a 400 with row-level validation messages),
    // and callers rely on seeing it when present.
    response.jobId = asyncUpsertResponse.data.requestId
    response.status = asyncUpsertResponse.status

    // No HTTP errors, consider all rows as accepted for processing by SFMC
    if (asyncUpsertResponse.ok) {
      // resultMessages is "typically" empty on a 2xx, but SFMC can attach informational
      // messages/warnings even on an accepted submission. Surface them (they don't change the
      // outcome -- per-row results still come from the poll's /results call) so they're not
      // silently dropped.
      if (asyncUpsertResponse.data.resultMessages && asyncUpsertResponse.data.resultMessages.length > 0) {
        logger?.warn?.(
          `SFMC async submit accepted (${asyncUpsertResponse.status}) with resultMessages for requestId ${
            asyncUpsertResponse.data.requestId ?? 'unknown'
          }: ${JSON.stringify(asyncUpsertResponse.data.resultMessages)}`
        )
      }

      for (let i = 0; i < payload.length; i++) {
        response.multiStatusResponse.setSuccessResponseAtIndex(i, {
          status: 200,
          sent: JSON.stringify(payload[i]),
          body: {}
        })
      }
      return response
    }

    // Every remaining case is a batch-level rejection -- same per-row error treatment, differing
    // only in the message/body sourced from the response (resolved by shape above).
    const { errormessage, body } = resolveBatchErrorDetail(asyncUpsertResponse.data)

    for (let i = 0; i < payload.length; i++) {
      response.multiStatusResponse.setErrorResponseAtIndex(i, {
        status: asyncUpsertResponse.status,
        errormessage,
        sent: JSON.stringify(payload[i]),
        body
      })
    }
    return response
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

      // Defensive integrity check: the nested status object echoes the original job's requestId.
      // If it doesn't match the job we polled, we may be reading a stale/mismatched response
      // (proxy/cache quirk, SFMC bug) -- log it rather than trust counts for the wrong job. We
      // only warn (don't fail) to avoid false positives if SFMC's echoed shape ever varies.
      if (statusResponse.data.status.requestId && statusResponse.data.status.requestId !== payload.jobId) {
        logger?.warn?.(
          `SFMC async status requestId mismatch for job ${payload.jobId}: response reported ${statusResponse.data.status.requestId}`
        )
      }

      // Return IN_PROGRESS status if SFMC indicates that the request is still being processed
      if (
        statusResponse.data.status.requestStatus === 'Pending' ||
        statusResponse.data.status.requestStatus === 'Executing'
      ) {
        response.jobStatus = 'IN_PROGRESS'
        return response
      }

      // Treat requestStatus 'Error' as RETRYABLE, not terminal FAILED.
      //
      // SFMC's `requestStatus: 'Error'` is NOT reliably terminal -- it can appear while the job
      // is still being processed and then resolve to `Complete / OK`. Confirmed in production:
      // a poll that landed ~0.5s before a job's completionDateTime saw a transient failure state,
      // yet the same job's /status later reported Complete/OK with every row upserted
      // (2809/2809), and the rows were present in the data extension. Reporting FAILED here
      // produced false "message rejected" drops for batches that actually delivered in full.
      //
      // So we return RETRYABLE_ERROR and let the caller re-poll: a job that was merely mid-flight
      // resolves to SUCCEEDED (or Complete + Has Errors, which then yields real per-row detail)
      // on a subsequent poll, while a genuinely stuck job keeps returning this and is bounded by
      // the caller's own poll timeout/retry budget rather than being mis-reported as a hard,
      // undiagnosable drop. We surface SFMC's reason (resultMessages) in a warning for
      // diagnosis; there is no trustworthy per-record detail to attach at this stage, so we
      // leave multiStatusResponse unset (an empty one would be a misleading, truthy result).
      if (statusResponse.data.status.requestStatus === 'Error') {
        const errormessage = statusResponse.data.resultMessages?.[0]?.message ?? 'SFMC reported the request as failed'
        logger?.warn?.(
          `SFMC async /status reported requestStatus 'Error' for job ${payload.jobId}; treating as transient (RETRYABLE_ERROR) because SFMC's Error state is not reliably terminal. Reason: ${errormessage}`
        )
        response.jobStatus = 'RETRYABLE_ERROR'
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

      const items = await fetchAllResultItems(request, settings.subdomain, payload.jobId)

      // SFMC's /status can report hasErrors on a job whose /results page(s) come back with zero
      // (or a missing) items -- a status/results inconsistency, not proof the job actually
      // failed. Since we have no per-record detail to act on, treat it as retryable rather than
      // a hard FAILED with no explanation. Gated explicitly on statusHasErrors (not just the
      // empty/missing items check) so this can't misfire if this block is ever reached outside
      // the Complete+Has Errors path in a future refactor.
      if (statusHasErrors && items.length === 0) {
        logger?.warn?.(`SFMC async /status reported errors for job ${payload.jobId} but /results returned no items`)
        response.jobStatus = 'RETRYABLE_ERROR'
        return response
      }

      // Allocate only once we know we have per-record items to fill it with (the empty-items
      // path above returns without one).
      response.multiStatusResponse = new MultiStatusResponse()
      const { successCount, recoveredTransientCount, permanentErrorCount } = applyResultItems(
        response.multiStatusResponse,
        items
      )

      if (recoveredTransientCount > 0) {
        logger?.warn?.(
          `SFMC async job ${payload.jobId}: ${recoveredTransientCount} row(s) reported transient deadlock errors in /results; counted as delivered (SFMC lands these on internal retry). permanent errors: ${permanentErrorCount}, ok: ${successCount}`
        )
      }

      // SUCCEEDED if any row was delivered (a genuine OK or a recovered transient deadlock);
      // only FAILED when every row was a permanent, non-retryable error.
      response.jobStatus = successCount + recoveredTransientCount > 0 ? 'SUCCEEDED' : 'FAILED'

      return response
    } catch (error) {
      // The /results call above may have thrown after response.multiStatusResponse was already
      // initialized to an empty (but truthy) instance -- discard it so callers don't mistake
      // "we never got any per-record data" for a real, if empty, multi-status result.
      delete response.multiStatusResponse

      if (!(error instanceof HTTPError)) {
        // Network-level failures (timeouts, connection resets, DNS issues) are transient -- the
        // job itself may be fine (confirmed in production: a poll that hit one of these mid-flight
        // for a job that had already completed successfully). Classification comes from
        // actions-core's shared isRetryableNetworkError helper, so there's no Node error-code list
        // to maintain here -- mirrors the same classification performBatch relies on.
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger?.warn?.(`SFMC async poll failed for job ${payload.jobId} with a non-HTTP error: ${message}`)

        response.status = 400
        response.jobStatus = isRetryableNetworkError(error) ? 'RETRYABLE_ERROR' : 'FAILED'
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
