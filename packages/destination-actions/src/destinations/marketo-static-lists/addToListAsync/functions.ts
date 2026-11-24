import {
  AsyncBatchResponse,
  ErrorCodes,
  HTTPError,
  IntegrationError,
  isRetryableNetworkError,
  JSONLikeObject,
  Logger,
  MultiStatusResponse,
  PollPayload,
  PollResponse,
  RequestClient,
  StatsContext
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { BULK_IMPORT_ENDPOINT, CSV_LIMIT, MarketoBulkImportResponse, MarketoResponse } from '../constants'
import { createFormData, formatEndpoint, MARKETO_NON_RETRYABLE_CODES } from '../functions'

const BULK_IMPORT_STATUS_ENDPOINT = '/bulk/v1/leads/batch/batchId.json'

// Marketo's bulk import job states. Docs list Queued, Importing, Complete and Failed.
type BulkImportStatus = 'Queued' | 'Importing' | 'Complete' | 'Failed'

type BulkImportStatusResponse = MarketoResponse & {
  result?: {
    batchId: number
    status: BulkImportStatus
    numOfLeadsProcessed?: number
    numOfRowsFailed?: number
    numOfRowsWithWarning?: number
    message?: string
  }[]
}

type ErrorClass = 'auth' | 'permanent' | 'retryable'

/**
 * Marketo returns HTTP 200 for most application errors and puts the code in the body
 * (`success: false`, `errors[0].code`), so the code - not the HTTP status - decides the outcome.
 * Unknown codes default to retryable, matching the existing sync actions, so a new Marketo code
 * never silently drops events.
 */
function classifyMarketoCode(code: string | undefined): ErrorClass {
  if (code === '601' || code === '602') return 'auth'
  if (code !== undefined && MARKETO_NON_RETRYABLE_CODES.has(code)) return 'permanent'
  return 'retryable'
}

/**
 * Builds an RFC 4180 CSV. Values containing a comma, quote, CR or LF are quoted (with embedded
 * quotes doubled). Only null/undefined become empty, so `0` and `false` survive.
 * Returns the CSV plus one line per payload (without the header) for use as the `sent` value.
 */
export function buildCsv(payloads: Payload[]): { csv: string; rows: string[] } {
  if (payloads.length === 0) return { csv: '', rows: [] }

  const keys = [...new Set(payloads.flatMap((p) => Object.keys(p.data)))]
  const escape = (value: unknown): string => {
    if (value === undefined || value === null) return ''
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const rows = payloads.map((p) => keys.map((k) => escape((p.data as Record<string, unknown>)[k])).join(','))
  return { csv: [keys.map(escape).join(','), ...rows].join('\n'), rows }
}

function failAllRows(
  count: number,
  status: number,
  errortype: keyof typeof ErrorCodes,
  errormessage: string,
  body?: JSONLikeObject
) {
  const multiStatusResponse = new MultiStatusResponse()
  for (let i = 0; i < count; i++) {
    multiStatusResponse.setErrorResponseAtIndex(i, { status, errortype, errormessage, ...(body ? { body } : {}) })
  }
  return multiStatusResponse
}

export async function submitBulkImport(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  statsContext?: StatsContext,
  hookOutputs?: { id?: string; name?: string }
): Promise<AsyncBatchResponse> {
  const listId = hookOutputs?.id ?? payloads[0]?.external_id

  if (!listId) {
    return {
      jobId: undefined,
      status: 400,
      multiStatusResponse: failAllRows(
        payloads.length,
        400,
        ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        'No list ID found in payload'
      )
    }
  }

  const { csv, rows } = buildCsv(payloads)

  // A single job maps to a single file, so an oversize batch can't be split here. Reject it with
  // a clear message; the real fix is an upstream threshold that keeps the batch under the limit.
  if (Buffer.byteLength(csv, 'utf8') > CSV_LIMIT) {
    statsContext?.statsClient?.incr('addToListAsync.error', payloads.length, statsContext?.tags)
    return {
      jobId: undefined,
      status: 400,
      multiStatusResponse: failAllRows(
        payloads.length,
        400,
        ErrorCodes.PAYLOAD_TOO_LARGE,
        `CSV data size exceeds limit of ${CSV_LIMIT} bytes`
      )
    }
  }

  const url =
    formatEndpoint(settings.api_endpoint) +
    BULK_IMPORT_ENDPOINT.replace('externalId', listId).replace('fieldToLookup', payloads[0].lookup_field)

  const response = await request<MarketoBulkImportResponse>(url, {
    method: 'POST',
    throwHttpErrors: false,
    headers: { 'Content-Type': 'multipart/form-data; boundary=--SEGMENT-DATA--' },
    body: createFormData(csv)
  })

  // Transport-level failure (the body may not be Marketo JSON). Keep the real HTTP status so
  // the orchestrator can tell a retryable 429/5xx from a permanent 4xx.
  if (!response.ok && response.data?.success === undefined) {
    const status = response.status
    return {
      jobId: undefined,
      status,
      multiStatusResponse: failAllRows(
        payloads.length,
        status,
        status === 429 || status >= 500 ? ErrorCodes.RETRYABLE_ERROR : ErrorCodes.BAD_REQUEST,
        `Marketo bulk import request failed with HTTP ${status}`
      )
    }
  }

  if (response.data.success) {
    const batchId = response.data.result?.[0]?.batchId
    if (batchId === undefined || batchId === null) {
      // 2xx + success but nothing to poll: we can't track this job, so don't claim delivery.
      return {
        jobId: undefined,
        status: 500,
        multiStatusResponse: failAllRows(
          payloads.length,
          500,
          ErrorCodes.RETRYABLE_ERROR,
          'Marketo accepted the import but returned no batchId'
        )
      }
    }

    statsContext?.statsClient?.incr('addToListAsync.submit', payloads.length, statsContext?.tags)

    // Accepted for processing only. Real per-job results come from performPoll.
    const multiStatusResponse = new MultiStatusResponse()
    for (let i = 0; i < payloads.length; i++) {
      multiStatusResponse.setSuccessResponseAtIndex(i, {
        status: 200,
        sent: rows[i] ?? '',
        body: response.data as unknown as JSONLikeObject
      })
    }
    return { jobId: String(batchId), status: 200, multiStatusResponse }
  }

  // success: false -> classify by Marketo code and surface it as the top-level status.
  const error = response.data.errors?.[0]
  const errorClass = classifyMarketoCode(error?.code)
  const message = error?.message ?? 'Unknown error: Marketo returned success=false with no error details'
  statsContext?.statsClient?.incr('addToListAsync.error', payloads.length, [
    ...(statsContext?.tags ?? []),
    `error_code:${error?.code ?? 'unknown'}`
  ])

  if (errorClass === 'auth') {
    // Thrown (not returned) so the token refresh flow is triggered, as in the other actions.
    throw new IntegrationError(message, ErrorCodes.INVALID_AUTHENTICATION, 401)
  }

  const status = errorClass === 'permanent' ? 400 : 500
  return {
    jobId: undefined,
    status,
    multiStatusResponse: failAllRows(
      payloads.length,
      status,
      errorClass === 'permanent' ? ErrorCodes.BAD_REQUEST : ErrorCodes.RETRYABLE_ERROR,
      message,
      error as unknown as JSONLikeObject
    )
  }
}

/**
 * Builds the poll multi-status. Marketo gives job-level counts only (the failures file has no
 * row numbers), so indices here do NOT correspond to original batch positions: the first
 * `successCount` rows are successes and the rest are failures. The async pipeline's contract is
 * aggregate (success_count + errors[] with counts), so only the counts matter.
 */
function aggregateMultiStatus(uploadCount: number, failedCount: number, failureMessage: string) {
  const failed = Math.min(Math.max(failedCount, 0), uploadCount)
  const multiStatusResponse = new MultiStatusResponse()
  for (let i = 0; i < uploadCount; i++) {
    if (i < uploadCount - failed) {
      multiStatusResponse.setSuccessResponseAtIndex(i, { status: 200, sent: {}, body: 'OK' })
    } else {
      multiStatusResponse.setErrorResponseAtIndex(i, {
        status: 400,
        errortype: ErrorCodes.BAD_REQUEST,
        errormessage: failureMessage
      })
    }
  }
  return multiStatusResponse
}

export async function pollBulkImport(
  request: RequestClient,
  settings: Settings,
  payload: PollPayload,
  logger?: Logger
): Promise<PollResponse> {
  const response: PollResponse = { jobId: payload.jobId, status: 200, jobStatus: 'IN_PROGRESS' }

  try {
    const url = formatEndpoint(settings.api_endpoint) + BULK_IMPORT_STATUS_ENDPOINT.replace('batchId', payload.jobId)
    const statusResponse = await request<BulkImportStatusResponse>(url, { method: 'GET' })
    response.status = statusResponse.status

    // The status endpoint also answers 200 with success:false, so check the body, not just HTTP.
    if (!statusResponse.data.success) {
      const error = statusResponse.data.errors?.[0]
      const errorClass = classifyMarketoCode(error?.code)

      if (errorClass === 'auth') {
        throw new IntegrationError(error?.message ?? 'Authentication failed', ErrorCodes.INVALID_AUTHENTICATION, 401)
      }

      logger?.warn?.(`Marketo bulk import status error for job ${payload.jobId}: ${JSON.stringify(error)}`)
      response.status = errorClass === 'permanent' ? 400 : 500
      response.jobStatus = errorClass === 'permanent' ? 'FAILED' : 'RETRYABLE_ERROR'
      return response
    }

    const job = statusResponse.data.result?.[0]
    if (!job) {
      // success:true with no job record - could be not yet visible. Retry rather than fail.
      logger?.warn?.(`Marketo bulk import status for job ${payload.jobId} had no result`)
      response.jobStatus = 'RETRYABLE_ERROR'
      return response
    }

    if (job.status === 'Queued' || job.status === 'Importing') {
      return response
    }

    if (job.status === 'Failed') {
      // The whole file was rejected. Treated as terminal; confirm against a live sandbox whether
      // Marketo ever reports Failed for a job that later recovers (SFMC's Error state does).
      response.jobStatus = 'FAILED'
      response.multiStatusResponse = aggregateMultiStatus(
        payload.uploadCount,
        payload.uploadCount,
        job.message ?? 'Marketo bulk import job failed'
      )
      return response
    }

    if (job.status === 'Complete') {
      const failed = job.numOfRowsFailed ?? 0
      response.multiStatusResponse = aggregateMultiStatus(
        payload.uploadCount,
        failed,
        job.message ?? `Marketo rejected ${failed} row(s) in import ${payload.jobId}`
      )
      // Partial success is SUCCEEDED per the pipeline contract; only an all-rows failure is FAILED.
      response.jobStatus = failed >= payload.uploadCount && payload.uploadCount > 0 ? 'FAILED' : 'SUCCEEDED'
      return response
    }

    // A status Marketo has not documented - don't guess terminal; keep polling.
    logger?.warn?.(`Marketo bulk import job ${payload.jobId} returned unrecognized status ${String(job.status)}`)
    response.jobStatus = 'RETRYABLE_ERROR'
    return response
  } catch (error) {
    delete response.multiStatusResponse

    if (error instanceof IntegrationError && error.status === 401) {
      throw error
    }

    if (!(error instanceof HTTPError)) {
      const retryable = isRetryableNetworkError(error)
      response.status = retryable ? 500 : 400
      response.jobStatus = retryable ? 'RETRYABLE_ERROR' : 'FAILED'
      return response
    }

    const status = error.response.status
    response.status = status
    response.jobStatus = status === 429 || status >= 500 ? 'RETRYABLE_ERROR' : 'FAILED'
    return response
  }
}
