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
import { external_id, lookup_field, data, enable_batching, batch_size, event_name } from '../properties'
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
  MarketoBulkImportResponse,
  MarketoBatchStatusResponse
} from '../constants'

// Network-level error codes that indicate a transient failure worth retrying.
const RETRYABLE_NETWORK_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND'])

function isRetryableNetworkError(error: unknown): boolean {
  const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined
  return code !== undefined && RETRYABLE_NETWORK_CODES.has(code)
}

const asyncAction: AsyncActionDefinition<Settings, Payload> = {
  title: 'Add to List (Async)',
  description:
    'Add users to a list in Marketo asynchronously using the Bulk Lead Import API. Submits an import job and polls its status.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    external_id: { ...external_id },
    lookup_field: { ...lookup_field },
    data: { ...data },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size },
    event_name: { ...event_name },
    // Hidden platform flag that signals Segment's async pipeline to route this action
    // through the async (performBatch + performPoll) lifecycle. Not read by action code.
    subscription_type: {
      label: 'Subscription Type',
      description: 'The type of subscription. Flag for enabling Async Pipeline.',
      type: 'string',
      choices: [
        { label: 'Sync', value: 'sync' },
        { label: 'Async', value: 'async' }
      ],
      default: 'async',
      required: false,
      unsafe_hidden: true
    }
  },

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
      api_endpoint + BULK_IMPORT_ENDPOINT.replace('externalId', list_id).replace('fieldToLookup', payload[0].lookup_field)

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

  // Poll the Bulk Import batch job for status. Granular per-record correlation via failures.json
  // is deferred to Phase 2 (option a: default rows to success, mark only failures.json rows as
  // errors, matched by lookup-field value). The poll payload only carries { jobId, uploadCount },
  // so obtaining the lookup values needs validation against a live Marketo instance first.
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
      const numFailed = result.numOfRowsFailed ?? 0
      if (numFailed === 0) {
        // Every uploaded row imported cleanly. Report success using the uploadCount from the poll,
        // avoiding the heavier failures.json fetch (mirrors the SFMC async fast path).
        response.jobStatus = 'SUCCEEDED'
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

      // Partial or full failure. Phase 2 will fetch failures.json and build a granular multistatus
      // (option a). For now report the terminal job outcome without per-record detail; PollResponse
      // allows an absent multiStatusResponse, in which case jobStatus/status drive the outcome.
      response.jobStatus = (result.numOfLeadsProcessed ?? 0) > 0 ? 'SUCCEEDED' : 'FAILED'
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
