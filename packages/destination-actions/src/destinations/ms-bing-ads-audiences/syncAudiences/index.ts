import { ActionDefinition, RequestClient, HTTPError, Logger, ModifiedResponse } from '@segment/actions-core'
import { MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  audience_id,
  traits_or_props,
  audience_key,
  batch_size,
  crm_id,
  email,
  enable_batching,
  identifier_type,
  computation_class
} from './fields'
import {
  preparePayload,
  sendDataToMicrosoftBingAds,
  handleMultistatusResponse,
  handleHttpError,
  categorizePayloadByAction
} from '../utils'
import { Identifier, SyncAudiencePayload, PartialError } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audiences',
  description: 'Sync users to Microsoft Bing Ads Audiences',
  fields: {
    audience_id,
    traits_or_props,
    audience_key,
    identifier_type,
    email,
    crm_id,
    enable_batching,
    batch_size,
    computation_class
  },
  perform: async (request, { payload, features, logger }) => {
    return await syncUser(request, [payload], false, isDebugLoggingEnabled(features), logger)
  },

  performBatch: async (request, { payload, features, logger }) => {
    return await syncUser(request, payload, true, isDebugLoggingEnabled(features), logger)
  }
}

// TEMPORARY DEBUG LOGGING — gated behind the 'actions-ms-bing-ads-audiences-debug-logging'
// feature flag. Logs non-sensitive request metadata (identifier type + item count) plus a
// redacted summary of the Bing Ads API response/errors to the centralized logging pipeline.
// It intentionally does NOT log CustomerListItems (hashed emails / CRM IDs) and strips the
// PartialError free-text fields (Message/Details/FieldPath) that can echo back identifiers —
// CRM IDs in particular are unhashed. Remove once debugging is complete.
const DEBUG_LOGGING_FLAG = 'actions-ms-bing-ads-audiences-debug-logging'

const isDebugLoggingEnabled = (features: Record<string, boolean> | undefined): boolean =>
  Boolean(features && features[DEBUG_LOGGING_FLAG])

// Cap logged bodies so a large or malformed response can't produce oversized log entries.
const MAX_LOGGED_BODY_LENGTH = 4096

// Truncate without splitting a surrogate pair (which would emit a lone surrogate), and strip
// control characters so logged content can't forge log lines or inject control sequences.
const sanitizeForLog = (value: string): string => {
  let out = value
  if (out.length > MAX_LOGGED_BODY_LENGTH) {
    let end = MAX_LOGGED_BODY_LENGTH
    const code = out.charCodeAt(end - 1)
    // If the cut lands on the high half of a surrogate pair, drop it.
    if (code >= 0xd800 && code <= 0xdbff) {
      end -= 1
    }
    out = `${out.slice(0, end)}…[truncated]`
  }
  // Stripping control chars is the intent here, so no-control-regex is expected.
  // eslint-disable-next-line no-control-regex
  return out.replace(/[\u0000-\u001f\u007f]/g, ' ')
}

// Build a PII-safe summary of the Bing Ads response. PartialErrors are reduced to their codes
// and index — the free-text Message/Details/FieldPath fields can echo back the offending
// identifier value, so they are dropped.
const summarizeErrors = (errors: PartialError[] | undefined): string => {
  if (!errors || errors.length === 0) {
    return '[]'
  }
  return JSON.stringify(errors.map((e) => ({ ErrorCode: e.ErrorCode, Code: e.Code, Index: e.Index, Type: e.Type })))
}

// Extract Microsoft's request/tracking identifier so it can be quoted to Bing Ads support.
// It is normally returned as a response header (TrackingId / x-ms-trackingid / RequestId) and
// is sometimes also echoed in the body as a top-level id field. It is a short opaque id, not
// PII, so it is logged in full (control chars stripped, never truncated).
const TRACKING_HEADER_NAMES = ['trackingid', 'x-ms-trackingid', 'requestid', 'x-ms-requestid']
const TRACKING_BODY_KEYS = ['TrackingId', 'RequestId']

const extractTrackingId = (headers: Headers | undefined, body: unknown): string => {
  for (const name of TRACKING_HEADER_NAMES) {
    const value = headers?.get(name)
    if (value) {
      return value
    }
  }
  if (body && typeof body === 'object') {
    for (const key of TRACKING_BODY_KEYS) {
      const value = (body as Record<string, unknown>)[key]
      if (typeof value === 'string' && value) {
        return value
      }
    }
  }
  return 'none'
}

// Run a logging side effect, swallowing any error: temporary debug logging must never alter
// the action's control flow (e.g. by masking the original error in the catch path).
const safeLog = (fn: () => void): void => {
  try {
    fn()
  } catch {
    // Intentionally ignored — debug logging is best-effort.
  }
}

// TEMPORARY: logs a redacted summary of the Bing Ads response, plus non-sensitive metadata about
// the request and Microsoft's tracking id (for support tickets). We intentionally do NOT log
// CustomerListItems (hashed emails / CRM IDs) or the PartialError free-text fields — only
// identifier type, item count, status, tracking id and error codes.
const logBingAdsResponse = (
  logger: Logger | undefined,
  debugLogging: boolean,
  action: string,
  audienceId: string,
  sentPayload: SyncAudiencePayload,
  response: ModifiedResponse
): void => {
  if (!debugLogging || !logger) {
    return
  }
  const { CustomerListItemSubType, CustomerListItems } = sentPayload.CustomerListUserData
  const partialErrors = (response.data as { PartialErrors?: PartialError[] } | undefined)?.PartialErrors
  const trackingId = extractTrackingId(response.headers, response.data)
  safeLog(() =>
    logger.info(
      `[ms-bing-ads-audiences][DEBUG] ${action} audienceId=${audienceId} status=${response.status} ` +
        `trackingId=${sanitizeForLog(trackingId)} ` +
        `identifierType=${CustomerListItemSubType} itemCount=${CustomerListItems.length} ` +
        `partialErrors=${sanitizeForLog(summarizeErrors(partialErrors))}`
    )
  )
}

// TEMPORARY: logs the error returned by Bing Ads when an Apply call fails, plus the same
// non-sensitive metadata as the success log so the failure can be correlated with the attempted
// operation. `attempted` is the payload of the in-flight Apply call (undefined if it failed
// before a call was made). When the body parses as JSON, PartialErrors are reduced to a
// PII-safe summary; otherwise only the HTTP status is logged (the raw body can echo back
// identifiers, so it is not logged verbatim). The response is cloned so handleHttpError can
// still consume the original body.
const logBingAdsError = async (
  logger: Logger | undefined,
  debugLogging: boolean,
  audienceId: string,
  error: unknown,
  attempted?: SyncAudiencePayload
): Promise<void> => {
  if (!debugLogging || !logger) {
    return
  }
  let detail: string
  if (error instanceof HTTPError) {
    const status = error.response?.status
    let summary = '<unparseable>'
    let parsed: { PartialErrors?: PartialError[] } | undefined
    try {
      parsed = (await error.response?.clone().json()) as { PartialErrors?: PartialError[] } | undefined
      summary = summarizeErrors(parsed?.PartialErrors)
    } catch {
      // Non-JSON or already-consumed body — fall back to status only, never the raw body.
    }
    const trackingId = extractTrackingId(error.response?.headers, parsed)
    detail = `status=${status ?? 'unknown'} trackingId=${sanitizeForLog(trackingId)} partialErrors=${summary}`
  } else {
    detail = `error=${error instanceof Error ? error.message : String(error)}`
  }
  const data = attempted?.CustomerListUserData
  const context = data
    ? `action=${data.ActionType} identifierType=${data.CustomerListItemSubType} itemCount=${data.CustomerListItems.length} `
    : ''
  safeLog(() =>
    logger.error(
      `[ms-bing-ads-audiences][DEBUG] Apply failed audienceId=${audienceId} ${context}${sanitizeForLog(detail)}`
    )
  )
}

/**
 * Synchronizes user audience data with Microsoft Bing Ads.
 *
 * This function processes a batch of user audience data, validates the input,
 * prepares the data for the Microsoft Bing Ads API, sends the data, and handles the response.
 * It returns a `MultiStatusResponse` object containing the status of each operation.
 *
 * @param request - The HTTP request client used to communicate with Microsoft Bing Ads.
 * @param payload - An array of user audience payloads to be synchronized.
 * @param isBatch - Indicates whether the operation is a batch process.
 * @returns A promise that resolves to a `MultiStatusResponse` object summarizing the results.
 * @throws Will throw an error if a non-batch operation fails, or rethrows non-HTTP errors in batch mode.
 */
const syncUser = async (
  request: RequestClient,
  payload: Payload[],
  isBatch: boolean,
  debugLogging = false,
  logger?: Logger
) => {
  const msResponse = new MultiStatusResponse()

  if (!Array.isArray(payload) || payload.length === 0) {
    return msResponse
  }

  // Identifier type is static for every batch as it's set in the batch keys array
  const identifierType: Identifier = payload[0]?.identifier_type as Identifier

  // Audience ID value is static for every batch as it's set in the batch keys array
  const audienceId = payload[0]?.audience_id

  const addMap: Map<string, number[]> = new Map()
  const removeMap: Map<string, number[]> = new Map()

  categorizePayloadByAction(payload, addMap, removeMap)

  const addItems = Array.from(addMap.keys())
  const removeItems = Array.from(removeMap.keys())

  const addPayload: SyncAudiencePayload = preparePayload(audienceId, 'Add', identifierType, addItems)

  const removePayload: SyncAudiencePayload = preparePayload(audienceId, 'Remove', identifierType, removeItems)

  // Tracks the Apply payload currently in flight so an error can be correlated with the
  // operation (Add vs Remove) that failed.
  let attemptedPayload: SyncAudiencePayload | undefined

  try {
    // Send data to Microsoft Bing Ads for both Add and Remove actions if they have entries
    if (addMap.size > 0) {
      attemptedPayload = addPayload
      const response = await sendDataToMicrosoftBingAds(request, addPayload)
      logBingAdsResponse(logger, debugLogging, 'Add', audienceId, addPayload, response)
      handleMultistatusResponse(msResponse, response, addItems, addMap, payload, isBatch)
    }
    if (removeMap.size > 0) {
      attemptedPayload = removePayload
      const response = await sendDataToMicrosoftBingAds(request, removePayload)
      logBingAdsResponse(logger, debugLogging, 'Remove', audienceId, removePayload, response)
      handleMultistatusResponse(msResponse, response, removeItems, removeMap, payload, isBatch)
    }
  } catch (error) {
    await logBingAdsError(logger, debugLogging, audienceId, error, attemptedPayload)
    if (!isBatch) {
      throw error
    }
    if (error instanceof HTTPError) {
      await handleHttpError(msResponse, error, new Map([...addMap.entries(), ...removeMap.entries()]), payload)
    } else {
      throw error
    }
  }

  return msResponse
}

export default action
