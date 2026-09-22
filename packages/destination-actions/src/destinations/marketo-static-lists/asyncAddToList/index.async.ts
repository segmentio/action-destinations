import {
  AsyncActionDefinition,
  AsyncBatchResponse,
  PollResponse,
  MultiStatusResponse,
  IntegrationError,
  APIError,
  RetryableError,
  HTTPError,
  ErrorCodes,
  JSONLikeObject
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import {
  formatEndpoint,
  formatData,
  createFormData,
  parseErrorResponseBatch,
  buildMultiStatusErrorResponse
} from '../functions'
import {
  CSV_LIMIT,
  BULK_IMPORT_ENDPOINT,
  BULK_IMPORT_STATUS_ENDPOINT,
  BULK_IMPORT_FAILURES_ENDPOINT,
  MarketoBulkImportResponse,
  MarketoBatchStatusResponse
} from '../constants'
import type { RequestClient, Logger } from '@segment/actions-core'

// Network-level error codes that indicate a transient failure worth retrying.
const RETRYABLE_NETWORK_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND'])

function isRetryableNetworkError(error: unknown): boolean {
  const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined
  return code !== undefined && RETRYABLE_NETWORK_CODES.has(code)
}

// Best-effort: fetch failures.json (CSV of only the failed rows + a trailing reason column) and
// summarize the distinct reasons into a short message. This is purely for surfacing WHY rows failed
// -- it is NOT used to attribute failures to specific payload indices (the poll phase has neither the
// original payloads nor an ordering guarantee, and Marketo returns only the failed subset). The file
// 404s when numOfRowsFailed is 0, so callers must only invoke this when the count is > 0.
async function fetchFailureReasons(
  request: RequestClient,
  apiEndpoint: string,
  jobId: string,
  logger?: Logger
): Promise<string | undefined> {
  try {
    const failuresUrl = apiEndpoint + BULK_IMPORT_FAILURES_ENDPOINT.replace('batchId', jobId)
    const failuresResponse = await request<string>(failuresUrl, {
      method: 'GET',
      throwHttpErrors: false,
      skipResponseCloning: true
    })

    if (failuresResponse.status !== 200) {
      return undefined
    }

    return summarizeFailureReasons(failuresResponse.content)
  } catch (error) {
    // Enrichment only -- never let a failures.json problem change the job outcome.
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger?.warn?.(`Marketo async: failed to read failures.json for batch ${jobId}: ${message}`)
    return undefined
  }
}

// Parse the failures CSV and return the distinct reasons (from the column whose header contains
// "Reason", falling back to the last column) joined into one short message.
function summarizeFailureReasons(csv: string): string | undefined {
  const lines = (csv ?? '').trim().split(/\r?\n/)
  if (lines.length < 2) {
    return undefined
  }

  const header = lines[0].split(',')
  const reasonIndex = header.findIndex((h) => /reason/i.test(h))
  const columnIndex = reasonIndex >= 0 ? reasonIndex : header.length - 1

  const reasons = new Set<string>()
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',')
    const reason = cells[columnIndex]?.trim()
    if (reason) {
      reasons.add(reason)
    }
  }

  if (reasons.size === 0) {
    return undefined
  }

  return `Marketo bulk import failure(s): ${Array.from(reasons).join('; ')}`
}

const asyncAction: AsyncActionDefinition<Settings, Payload> = {
  title: 'Add to List (Async)',
  description:
    'Add users to a list in Marketo asynchronously using the Bulk Lead Import API. Submits an import job and polls its status.',
  defaultSubscription: 'event = "Audience Entered"',
  fields,

  // Submit the CSV of leads to the Bulk Import API and return the Marketo batchId as the jobId.
  performBatch: async (request, { settings, payload }) => {
    const response: AsyncBatchResponse = {
      multiStatusResponse: new MultiStatusResponse(),
      jobId: undefined,
      status: 200
    }

    // Audience-connected destination: the list id arrives via context.personas.external_audience_id.
    const list_id = payload[0]?.external_id
    if (!list_id) {
      response.status = 400
      response.multiStatusResponse = buildMultiStatusErrorResponse(payload.length, {
        status: 400,
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        errormessage: 'No list ID found in payload'
      })
      return response
    }

    const api_endpoint = formatEndpoint(settings.api_endpoint)
    const [csvData, csvDataItems] = formatData(payload)

    const csvSize = Buffer.byteLength(csvData, 'utf8')
    if (csvSize > CSV_LIMIT) {
      response.status = 400
      response.multiStatusResponse = buildMultiStatusErrorResponse(payload.length, {
        status: 400,
        errortype: ErrorCodes.PAYLOAD_TOO_LARGE,
        errormessage: `CSV data size exceeds limit of ${CSV_LIMIT} bytes`
      })
      return response
    }

    const url =
      api_endpoint +
      BULK_IMPORT_ENDPOINT.replace('externalId', list_id).replace('fieldToLookup', payload[0].lookup_field)

    let importResponse
    try {
      importResponse = await request<MarketoBulkImportResponse>(url, {
        method: 'POST',
        throwHttpErrors: false,
        skipResponseCloning: true,
        headers: {
          'Content-Type': 'multipart/form-data; boundary=--SEGMENT-DATA--'
        },
        body: createFormData(csvData)
      })
    } catch (error: unknown) {
      // throwHttpErrors is false, so this catch is for transport-level failures.
      // Preserve the upstream status so 429/5xx get retried and other 4xx don't.
      if (error instanceof HTTPError) {
        const status = error.response?.status ?? 500
        throw new APIError(`Failed to submit Marketo bulk import: ${error.message}`, status)
      }

      if (isRetryableNetworkError(error)) {
        throw new RetryableError(`Failed to submit Marketo bulk import: ${(error as Error).message}`)
      }

      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new IntegrationError(`Failed to submit Marketo bulk import: ${message}`, ErrorCodes.BAD_REQUEST, 400)
    }

    response.status = importResponse.status

    // Surface the batchId as the jobId whenever Marketo assigns one, even on a rejected import.
    const batch = importResponse.data.result?.[0]
    if (batch?.batchId !== undefined && batch?.batchId !== null) {
      response.jobId = String(batch.batchId)
    }

    if (importResponse.data.success) {
      for (let i = 0; i < payload.length; i++) {
        response.multiStatusResponse.setSuccessResponseAtIndex(i, {
          status: 200,
          sent: csvDataItems[i] ?? '',
          body: importResponse.data as unknown as JSONLikeObject
        })
      }
      return response
    }

    // success === false. parseErrorResponseBatch throws for auth errors (601/602) so the framework
    // can trigger a token refresh; the thrown error must propagate rather than be caught above and
    // re-mapped to a 400. Otherwise it returns a per-index error MultiStatusResponse.
    response.multiStatusResponse = parseErrorResponseBatch(importResponse.data, payload.length)
    return response
  },

  // Poll the Bulk Import batch job for status and report outcomes by COUNT.
  //
  // Marketo's Bulk Import is a batch-level async API: it does not support per-record attribution at
  // poll time. Confirmed against a live instance -- invalid emails become warnings (row still
  // imported), structural row noise is ignored, and bad headers are rejected by the submit call
  // itself (handled in performBatch). Genuine poll-time row failures are rare, and failures.json
  // returns only the failed subset with no ordering guarantee. The poll payload also carries only
  // { jobId, uploadCount } -- no original payloads. So we cannot map a failed row back to a specific
  // payload index. Instead we report accurate COUNTS from the status response: the exact number of
  // successes and failures is correct, but which specific indices are marked failed is approximate.
  // Warnings are treated as success (mirrors Marketo's own "Import succeeded" verdict).
  performPoll: async (request, { settings, payload, logger }) => {
    const response: PollResponse = {
      jobId: payload.jobId,
      status: 200,
      jobStatus: 'IN_PROGRESS'
    }

    const api_endpoint = formatEndpoint(settings.api_endpoint)
    const url = api_endpoint + BULK_IMPORT_STATUS_ENDPOINT.replace('batchId', payload.jobId)

    try {
      const statusResponse = await request<MarketoBatchStatusResponse>(url, {
        method: 'GET',
        skipResponseCloning: true
      })

      response.status = statusResponse.status

      const result = statusResponse.data.result?.[0]
      if (!result) {
        // No result element yet: treat as transient (job not picked up / status not materialized).
        logger?.warn?.(
          `Marketo async status response missing result for batch ${payload.jobId}: ${JSON.stringify(
            statusResponse.data
          )}`
        )
        response.jobStatus = 'RETRYABLE_ERROR'
        return response
      }

      if (result.status === 'Queued' || result.status === 'Importing') {
        response.jobStatus = 'IN_PROGRESS'
        return response
      }

      if (result.status === 'Failed') {
        response.jobStatus = 'FAILED'
        return response
      }

      // result.status === 'Complete'
      const uploadCount = payload.uploadCount
      // numOfRowsWithWarning intentionally does NOT count as a failure -- Marketo still imported
      // those rows. Only numOfRowsFailed reduces the success count.
      const failedCount = Math.min(result.numOfRowsFailed ?? 0, uploadCount)
      const successCount = uploadCount - failedCount

      response.multiStatusResponse = new MultiStatusResponse()

      if (failedCount === 0) {
        // Every uploaded row imported (warnings included). Skip the failures.json fetch entirely --
        // it would 404 with a zero failure count anyway.
        response.jobStatus = 'SUCCEEDED'
        for (let i = 0; i < uploadCount; i++) {
          response.multiStatusResponse.setSuccessResponseAtIndex(i, { status: 200, sent: {}, body: 'OK' })
        }
        return response
      }

      // Some rows failed. Fetch failures.json only to enrich the error message with the reason(s);
      // it is not used to pick which indices failed (see the method comment).
      const failureReason =
        (await fetchFailureReasons(request, api_endpoint, payload.jobId, logger)) ??
        `Row failed during Marketo bulk import (batch ${payload.jobId})`

      // Approximate attribution: mark the first `successCount` indices as success and the remaining
      // `failedCount` as errors. Counts are exact; specific index attribution is best-effort.
      for (let i = 0; i < uploadCount; i++) {
        if (i < successCount) {
          response.multiStatusResponse.setSuccessResponseAtIndex(i, { status: 200, sent: {}, body: 'OK' })
        } else {
          response.multiStatusResponse.setErrorResponseAtIndex(i, { status: 400, errormessage: failureReason })
        }
      }

      response.jobStatus = successCount > 0 ? 'SUCCEEDED' : 'FAILED'
      return response
    } catch (error) {
      if (!(error instanceof HTTPError)) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger?.warn?.(`Marketo async poll failed for batch ${payload.jobId} with a non-HTTP error: ${message}`)
        response.status = 400
        response.jobStatus = isRetryableNetworkError(error) ? 'RETRYABLE_ERROR' : 'FAILED'
        return response
      }

      // 429/5xx are transient on Marketo's side; retry the poll.
      if (error.response.status === 429 || error.response.status >= 500) {
        response.status = error.response.status
        response.jobStatus = 'RETRYABLE_ERROR'
        return response
      }

      response.status = error.response.status
      response.jobStatus = 'FAILED'
      return response
    }
  }
}

export default asyncAction
