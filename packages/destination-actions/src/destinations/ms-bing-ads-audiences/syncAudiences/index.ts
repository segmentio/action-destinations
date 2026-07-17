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

// TEMPORARY DEBUG LOGGING — gated behind the 'actions-ms-bing-ads-audiences-debug-logging' feature
// flag (off by default). Logs Microsoft's tracking id (needed to file Bing Ads support tickets)
// plus non-sensitive request metadata and a redacted error summary. It intentionally does NOT log
// CustomerListItems (hashed emails / unhashed CRM ids) or the PartialError free-text fields
// (Message/Details/FieldPath), which can echo back an identifier. Remove once debugging is done.
const DEBUG_LOGGING_FLAG = 'actions-ms-bing-ads-audiences-debug-logging'

const isDebugLoggingEnabled = (features: Record<string, boolean> | undefined): boolean =>
  Boolean(features?.[DEBUG_LOGGING_FLAG])

// Microsoft returns its request/tracking id as a response header (and sometimes echoes it in the
// body). It's a short opaque id, not PII.
const extractTrackingId = (response: ModifiedResponse): string => {
  const header = response.headers?.get('trackingid') || response.headers?.get('x-ms-trackingid')
  if (header) return header
  const body = response.data as { TrackingId?: string } | undefined
  return body?.TrackingId || 'none'
}

// Reduce PartialErrors to codes + index; the free-text fields can echo back the offending
// identifier so they are dropped.
const summarizeErrors = (errors: PartialError[] | undefined): string =>
  JSON.stringify((errors ?? []).map((e) => ({ ErrorCode: e.ErrorCode, Code: e.Code, Index: e.Index, Type: e.Type })))

// TEMPORARY: log a redacted, PII-safe summary of a successful Bing Ads response.
const logBingAdsResponse = (
  logger: Logger | undefined,
  debugLogging: boolean,
  action: string,
  audienceId: string,
  sentPayload: SyncAudiencePayload,
  response: ModifiedResponse
): void => {
  // TEMPORARY DIAGNOSTIC: log BEFORE the guard, via console (never gated on `logger`), so staging
  // logs tell us which precondition fails. If this [PROBE] line is absent, logBingAdsResponse
  // isn't being called at all on this delivery path; if present, it reports whether debugLogging
  // and logger are actually set. Remove once the logger behaviour is confirmed.
  // eslint-disable-next-line no-console
  console.log(
    `[ms-bing-ads-audiences][PROBE] ${action} audienceId=${audienceId} debugLogging=${debugLogging} hasLogger=${Boolean(
      logger
    )} loggerType=${typeof logger?.warn}`
  )
  if (!debugLogging || !logger) return
  // Isolate from delivery control flow: this runs inside the syncUser try/catch after Bing has
  // already accepted the records, so a throwing/partial logger must never fail an otherwise
  // successful (batch) delivery or trigger a duplicate re-send on retry.
  try {
    const { CustomerListItemSubType, CustomerListItems } = sentPayload.CustomerListUserData
    const partialErrors = (response.data as { PartialErrors?: PartialError[] } | undefined)?.PartialErrors
    const line =
      `[ms-bing-ads-audiences][DEBUG] ${action} audienceId=${audienceId} status=${response.status} ` +
      `trackingId=${extractTrackingId(response)} identifierType=${CustomerListItemSubType} ` +
      `itemCount=${CustomerListItems.length} partialErrors=${summarizeErrors(partialErrors)}`
    // TEMPORARY DIAGNOSTIC: confirm the emit is reached and surfaces via console (ungated on the
    // logger's own health). If [CONSOLE] appears but the [DEBUG] warn below doesn't, the logger
    // itself is the problem. Remove once the logger behaviour is confirmed.
    // eslint-disable-next-line no-console
    console.log(`[ms-bing-ads-audiences][CONSOLE] ${line.slice(0, 4096)}`)
    // Emit at warn: the delivery runtime's logger filters out info-level lines, so info never
    // reaches the log pipeline. warn is the lowest level that reliably ships. Uses the optional
    // ?.warn?.() call idiom so a partial logger no-ops rather than throwing.
    logger?.warn?.(line.slice(0, 4096))
  } catch {
    // Best-effort debug logging — intentionally swallowed.
  }
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

  try {
    // Send data to Microsoft Bing Ads for both Add and Remove actions if they have entries
    if (addMap.size > 0) {
      const response = await sendDataToMicrosoftBingAds(request, addPayload)
      logBingAdsResponse(logger, debugLogging, 'Add', audienceId, addPayload, response)
      handleMultistatusResponse(msResponse, response, addItems, addMap, payload, isBatch)
    }
    if (removeMap.size > 0) {
      const response = await sendDataToMicrosoftBingAds(request, removePayload)
      logBingAdsResponse(logger, debugLogging, 'Remove', audienceId, removePayload, response)
      handleMultistatusResponse(msResponse, response, removeItems, removeMap, payload, isBatch)
    }
  } catch (error) {
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
