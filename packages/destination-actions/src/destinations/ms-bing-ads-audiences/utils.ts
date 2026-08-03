import { processHashing } from '../../lib/hashing-utils'
import { Payload } from './syncAudiences/generated-types'
import {
  JSONLikeObject,
  MultiStatusResponse,
  RequestClient,
  HTTPError,
  ModifiedResponse,
  IntegrationError
} from '@segment/actions-core'
import { BASE_URL } from './constants'
import { SyncAudiencePayload, PartialError, Action, Identifier, BingFaultResponse } from './types'

/**
 * Hashes an email address using the SHA-256 algorithm and returns the result as a hexadecimal string.
 *
 * The email address is first trimmed of whitespace and converted to lowercase before hashing.
 *
 * @param item - The email address to be hashed.
 * @returns The SHA-256 hash of the normalized email address in hexadecimal format.
 */
export const hashEmail = (item: string): string => {
  return processHashing(item, 'sha256', 'hex', (value) => value.trim().toLowerCase())
}

/**
 * Categorizes payload items into add and remove actions based on audience key.
 *
 * @param payload - Array of user audience payloads to be categorized
 * @param addMap - Map to store identifiers for Add actions with their original index
 * @param removeMap - Map to store identifiers for Remove actions with their original index
 */
export const categorizePayloadByAction = (
  payload: Payload[],
  addMap: Map<string, number[]>,
  removeMap: Map<string, number[]>
) => {
  payload.forEach((p, index) => {
    const action: Action = p.traits_or_props[p.audience_key] ? 'Add' : 'Remove'
    // @ts-ignore - Email is required if identifier_type is Email and crm_id is required if identifier_type is CRM
    const identifier: string = (p.identifier_type === 'Email' ? hashEmail(p.email) : p.crm_id) as string

    if (action === 'Add') {
      if (!addMap.has(identifier)) {
        addMap.set(identifier, [])
      }
      addMap.get(identifier)?.push(index)
    } else {
      if (!removeMap.has(identifier)) {
        removeMap.set(identifier, [])
      }
      removeMap.get(identifier)?.push(index)
    }
  })
}

/**
 * Prepares the payload object required for syncing audience data with Microsoft Bing Ads.
 *
 * @param audienceId - The unique identifier for the audience to be updated.
 * @param action - The action type to perform (e.g., 'Add', 'Remove').
 * @param identifierType - The type of identifier used for the customer list items (e.g., 'Email', 'Phone').
 * @param listItems - An array of customer identifiers to be included in the payload.
 * @returns The payload object formatted for the Bing Ads API.
 */
export const preparePayload = (
  audienceId: string,
  action: Action,
  identifierType: Identifier,
  listItems: string[]
): SyncAudiencePayload => {
  return {
    CustomerListUserData: {
      ActionType: action,
      AudienceId: audienceId,
      CustomerListItemSubType: identifierType,
      CustomerListItems: listItems
    }
  }
}

/**
 * Sends audience data to the Microsoft Bing Ads API.
 *
 * @param request - The HTTP request client used to send the request.
 * @param payload - The payload containing audience data to be synchronized.
 * @returns A promise that resolves to the response from the Microsoft Bing Ads API.
 */
export const sendDataToMicrosoftBingAds = async (request: RequestClient, payload: SyncAudiencePayload) => {
  const response = await request(`${BASE_URL}/CustomerListUserData/Apply`, {
    method: 'POST',
    json: payload
  })
  return response
}

/**
 * Handles the response from a multi-status API call, processing partial errors and marking items as successful or failed.
 *
 * This function iterates through any partial errors returned in the response, associates them with the corresponding items,
 * and updates the `msResponse` object with error details. Items without errors are marked as successful.
 *
 * @param msResponse - The response object to update with success or error statuses for each item.
 * @param response - The raw response from the API, potentially containing partial errors.
 * @param items - An array of item identifiers that were sent in the request.
 * @param listItemsMap - A map from item identifiers to their original indices in the payload.
 * @param payload - The original payload array sent to the API.
 * @param isBatch - Indicates whether the operation is being performed in batch mode. If false, a partial error will throw an IntegrationError.
 */
export const handleMultistatusResponse = (
  msResponse: MultiStatusResponse,
  response: ModifiedResponse,
  items: string[],
  listItemsMap: Map<string, number[]>,
  payload: Payload[],
  isBatch: boolean
): void => {
  const responseData = response?.data as { PartialErrors?: PartialError[] } | undefined
  if (responseData?.PartialErrors && responseData.PartialErrors.length > 0) {
    if (!isBatch) {
      throw new IntegrationError(responseData.PartialErrors[0].Message, 'PartialErrors', 400)
    }
    // Process partial errors
    responseData.PartialErrors.forEach((error: PartialError) => {
      // The error.Index corresponds to the position in the CustomerListItems array
      if (typeof error.Index === 'number' && error.Index >= 0 && error.Index < items.length) {
        const item = items[error.Index]
        const originalIndices = listItemsMap.get(item)

        if (originalIndices !== undefined && originalIndices.length > 0) {
          // Set error for all indices associated with this item
          originalIndices.forEach((originalIndex) => {
            msResponse.setErrorResponseAtIndex(originalIndex, {
              status: error.Code || 400,
              errormessage: `${error.ErrorCode ?? 'UnknownError'}: ${error.Message ?? 'No error message provided'}`,
              sent: payload[originalIndex] as unknown as JSONLikeObject,
              body: JSON.stringify(error)
            })
          })

          // Remove this item from the list of items to be marked as successful
          listItemsMap.delete(item)
        }
      }
    })
  }

  // Mark all remaining items as successful
  listItemsMap.forEach((indices) => {
    indices.forEach((index) => {
      msResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: payload[index] as unknown as JSONLikeObject,
        body: JSON.stringify(response) || 'Success'
      })
    })
  })
}

// Bing auth error codes whose fix is a token refresh (105 = invalid, 109 = expired). Normalizing
// these to HTTP 401 makes the framework's OAuth retry (destination-kit shouldRetry -> handleAuthError)
// refresh the token and retry. 106 (no access to the entity) is excluded: a refresh can't grant
// access, so it's surfaced as its real error instead.
// Docs: https://learn.microsoft.com/en-us/advertising/guides/handle-service-errors-exceptions
const REFRESHABLE_AUTH_ERROR_CODES = new Set([105, 109])

/**
 * Normalizes a Bing fault into the status + message we record per item. This is what fixes the
 * original bug: Bing's fault body has NO top-level `status` field (verified against a real expired-
 * token response: `{"Errors":[{"Code":109,...}],"TrackingId":...,"Type":"AdApiFaultDetail"}`), so the
 * old code's `errorResponse.status` was always `undefined`. The framework only refreshes when a
 * multistatus entry has `status === 401`, so an expired-token 401 was recorded as `undefined` and the
 * refresh never fired. We now record the REAL HTTP status (`error.response.status`) instead.
 *
 * We additionally force 401 for refreshable auth codes (105/109) even if the HTTP status isn't 401.
 * In practice the REST API returns 401 for an expired token, so this is a defensive hedge for Bing's
 * SOAP-era contract (errors as HTTP 500 — see the docs link on REFRESHABLE_AUTH_ERROR_CODES) in case
 * an auth fault ever arrives on a non-401 status. Handles both AdApiFaultDetail (`Errors`) and
 * ApiFaultDetail (`OperationErrors`).
 */
export const parseBingFault = (
  fault: BingFaultResponse | undefined,
  httpStatus: number | undefined,
  fallbackMessage: string
): { status: number; errormessage: string; trackingId?: string; refreshable: boolean } => {
  // Inspect ALL errors, not just the first: Bing can return a multi-error fault where the auth
  // code isn't in position 0. Coerce Code with Number() since JSON may deliver it as a string.
  const errors = [...(fault?.Errors ?? []), ...(fault?.OperationErrors ?? [])]
  // `refreshable` is true ONLY when a 105/109 code is actually present — this is what should drive a
  // token refresh, NOT a bare 401 status (a 106/no-access or bodyless 401 can't be fixed by a refresh).
  const refreshable = errors.some((e) => e.Code !== undefined && REFRESHABLE_AUTH_ERROR_CODES.has(Number(e.Code)))
  const status = refreshable ? 401 : httpStatus ?? 500

  const firstError = errors[0]
  const code = firstError?.Code !== undefined ? ` (${firstError.Code})` : ''
  const errormessage = firstError
    ? `${firstError.ErrorCode ?? 'UnknownError'}${code}: ${firstError.Message ?? fallbackMessage}`
    : fallbackMessage
  return { status, errormessage, trackingId: fault?.TrackingId, refreshable }
}

/**
 * Records a Bing HTTP failure against every affected payload index. Reads the body defensively
 * (Bing may return non-JSON / empty bodies) and surfaces the parsed fault, or the raw text when it
 * isn't the known shape.
 */
export const handleHttpError = async (
  msResponse: MultiStatusResponse,
  error: HTTPError,
  listItemsMap: Map<string, number[]>,
  payload: Payload[]
): Promise<void> => {
  // Parse the fault from the UNTRUNCATED body so status normalization (e.g. auth 105/109 -> 401,
  // which drives token refresh) is never lost to truncation. The request client's after-response
  // hook already parses JSON bodies into `response.data`, so prefer that; otherwise parse the raw
  // (untruncated) text.
  const fault = extractBingFault(error?.response)
  const { status, errormessage } = parseBingFault(fault, error?.response?.status, error.message)
  // Summarize the loggable body from the already-parsed fault when we have it — re-reading via
  // readResponseBody would truncate a large fault mid-JSON and lose the TrackingId/ErrorCode. Only
  // fall back to the raw (capped) body when the response wasn't the known fault shape.
  const loggableBody = fault ? formatBingFault(fault) : formatBingErrorBody(await readResponseBody(error?.response))

  listItemsMap.forEach((indices) => {
    indices.forEach((index) => {
      msResponse.setErrorResponseAtIndex(index, {
        status,
        errormessage,
        sent: payload[index] as unknown as JSONLikeObject,
        body: loggableBody
      })
    })
  })
}

// Inspects an HTTP error for a refreshable Bing auth failure (codes 105/109), regardless of the
// HTTP status Bing returned. Returns the refreshable flag plus the parsed error message so the
// single-event path can re-throw an InvalidAuthenticationError that carries the Bing ErrorCode/
// Message (not just the bare HTTP statusText).
export const inspectAuthError = (error: HTTPError): { refreshable: boolean; errormessage: string } => {
  const fault = extractBingFault(error?.response)
  const { refreshable, errormessage } = parseBingFault(fault, error?.response?.status, error.message)
  return { refreshable, errormessage }
}

// Pull the parsed Bing fault out of an error response without truncating: prefer the already-parsed
// `data` from the request client's after-response hook, else parse the untruncated raw text. Never
// throws — returns undefined when the body isn't the known JSON fault shape.
const extractBingFault = (response?: ModifiedResponse | Response): BingFaultResponse | undefined => {
  const data = (response as ModifiedResponse | undefined)?.data
  if (data && typeof data === 'object') {
    return data as BingFaultResponse
  }
  const content = (response as ModifiedResponse | undefined)?.content
  if (typeof content === 'string' && content) {
    try {
      return JSON.parse(content) as BingFaultResponse
    } catch {
      return undefined
    }
  }
  return undefined
}

// Cap the response body we fold into the error message. Bing (or an intermediary proxy) can
// return large HTML error pages, and the message ends up in logs / downstream payloads.
export const MAX_ERROR_BODY_LENGTH = 2048

/**
 * Safely reads the body of an error response from the Bing Ads API for logging.
 *
 * Bing can return an empty or non-JSON body on failures, so this never throws. It prefers the
 * already-parsed `content` that the request client populates (which is robust whether or not the
 * response stream was cloned) and only falls back to re-reading the stream via `text()`. The
 * result is truncated to a sane length, and falls back to an empty string if the body can't be read.
 */
export const readResponseBody = async (response?: ModifiedResponse | Response): Promise<string> => {
  if (!response) {
    return ''
  }
  const truncate = (text: string): string =>
    text.length > MAX_ERROR_BODY_LENGTH ? `${text.slice(0, MAX_ERROR_BODY_LENGTH)}...(truncated)` : text

  // `content` is the body the request client already read. Reading it avoids re-consuming the
  // response stream (which throws if it was not cloned — see skipResponseCloning). It is usually a
  // string, but handle Buffer / parsed-object shapes too so we don't silently lose Bing's payload.
  const content = (response as ModifiedResponse).content as unknown
  if (typeof content === 'string') {
    return truncate(content)
  }
  if (content != null) {
    try {
      return truncate(Buffer.isBuffer(content) ? content.toString('utf8') : JSON.stringify(content))
    } catch {
      // fall through to reading the stream
    }
  }
  try {
    return truncate((await response.text()) ?? '')
  } catch {
    return ''
  }
}

/**
 * Extracts the debugging-relevant, non-sensitive fields from a Bing Ads error body.
 *
 * Bing failures use two envelopes: AdApiFaultDetail nests errors under `Errors`, ApiFaultDetail
 * under `OperationErrors` — both share the { ErrorCode, Message, Code } shape:
 *   { Errors | OperationErrors: [{ ErrorCode, Message, Code }], TrackingId, Type }
 * We surface only ErrorCode, Message and TrackingId — the TrackingId is what Microsoft support
 * needs to investigate a failure, and these whole-request fault fields don't carry credentials or
 * identifiers (unlike per-item PartialError free-text, which is redacted elsewhere). If the body
 * isn't the known shape, we return a fixed placeholder rather than echoing raw text, which could
 * contain an echoed identifier.
 */
export const formatBingErrorBody = (rawBody: string): string => {
  if (!rawBody) {
    return 'no response body'
  }
  try {
    return formatBingFault(JSON.parse(rawBody) as BingFaultResponse)
  } catch {
    // Not the known JSON shape (HTML page, truncated body, etc.). Do NOT echo the raw text — Bing
    // error bodies can echo back the offending identifier (hashed email / CRM id). Surface nothing
    // beyond the fact that it was unparseable.
    return 'unparseable response body'
  }
}

// Per-error Message cap. Bing's own messages are short (~60 chars), but a proxy or an echoed value
// can be huge; capping each Message individually keeps the high-value ErrorCode + TrackingId from
// being truncated off the end when one message is oversized.
const MAX_FAULT_MESSAGE_LENGTH = 512

/**
 * Summarizes an already-parsed Bing fault into the same ErrorCode/Message/TrackingId string as
 * formatBingErrorBody. Preferred over re-reading the raw body when the fault is already in hand (see
 * handleHttpError): a large fault body that readResponseBody would truncate mid-JSON — and thus
 * render unparseable — still yields a useful summary here. Each Message is capped individually so the
 * short, high-value ErrorCode and TrackingId always survive, then the whole summary is capped too.
 */
export const formatBingFault = (fault: BingFaultResponse | undefined): string => {
  // Combine both envelopes (same as parseBingFault): `??` alone would drop OperationErrors when
  // Errors is an empty array (`[]`) rather than null/undefined.
  const errors = [...(fault?.Errors ?? []), ...(fault?.OperationErrors ?? [])]
  const parts = errors.map((e) => {
    const message = e?.Message ?? 'No error message provided'
    const capped = message.length > MAX_FAULT_MESSAGE_LENGTH ? `${message.slice(0, MAX_FAULT_MESSAGE_LENGTH)}…` : message
    return `${e?.ErrorCode ?? 'UnknownError'}: ${capped}`
  })
  if (fault?.TrackingId) {
    parts.push(`TrackingId: ${fault.TrackingId}`)
  }
  // No recognizable error fields — don't echo arbitrary parsed fields, which could carry an echoed
  // identifier (PII). Surface only that it was unrecognized.
  const summary = parts.length ? parts.join('; ') : 'unrecognized response body'
  return summary.length > MAX_ERROR_BODY_LENGTH ? `${summary.slice(0, MAX_ERROR_BODY_LENGTH)}...(truncated)` : summary
}
