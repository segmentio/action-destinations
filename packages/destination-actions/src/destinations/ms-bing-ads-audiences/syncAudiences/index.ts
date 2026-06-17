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
import { Identifier, SyncAudiencePayload } from '../types'

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
// feature flag. Logs non-sensitive request metadata (identifier type + item count) and the
// Bing Ads API response/error bodies to the centralized logging pipeline. It intentionally
// does NOT log CustomerListItems (hashed emails / CRM IDs). Remove once debugging is complete.
const DEBUG_LOGGING_FLAG = 'actions-ms-bing-ads-audiences-debug-logging'

const isDebugLoggingEnabled = (features: Record<string, boolean> | undefined): boolean =>
  Boolean(features && features[DEBUG_LOGGING_FLAG])

// Cap logged bodies so a large or malformed response can't produce oversized log entries.
const MAX_LOGGED_BODY_LENGTH = 4096

const truncate = (value: string): string =>
  value.length > MAX_LOGGED_BODY_LENGTH ? `${value.slice(0, MAX_LOGGED_BODY_LENGTH)}…[truncated]` : value

// TEMPORARY: logs the Bing Ads response body, plus non-sensitive metadata about the request.
// We intentionally do NOT log CustomerListItems (hashed emails / CRM IDs) — only the
// identifier type and item count — to avoid leaking customer-match identifiers into logs.
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
  // Use `response.content` (always a string) rather than `response.data` (can be undefined
  // for an empty/non-JSON body, which would make truncate() throw).
  logger.info(
    `[ms-bing-ads-audiences][DEBUG] ${action} audienceId=${audienceId} status=${response.status} ` +
      `identifierType=${CustomerListItemSubType} itemCount=${CustomerListItems.length} ` +
      `response=${truncate(response.content ?? '')}`
  )
}

// TEMPORARY: logs the error body returned by Bing Ads when an Apply call fails, plus the same
// non-sensitive metadata as the success log so the failure can be correlated with the attempted
// operation. `attempted` is the payload of the in-flight Apply call (undefined if it failed
// before a call was made). The body is read as text (not assumed to be JSON) and size-capped,
// then the response is cloned so handleHttpError can still consume the original body. We never
// log CustomerListItems.
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
  let body: string
  try {
    body = error instanceof HTTPError ? (await error.response?.clone().text()) ?? '' : String(error)
  } catch {
    body = error instanceof Error ? error.message : String(error)
  }
  const data = attempted?.CustomerListUserData
  const context = data
    ? `action=${data.ActionType} identifierType=${data.CustomerListItemSubType} itemCount=${data.CustomerListItems.length} `
    : ''
  logger.error(`[ms-bing-ads-audiences][DEBUG] Apply failed audienceId=${audienceId} ${context}error=${truncate(body)}`)
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
