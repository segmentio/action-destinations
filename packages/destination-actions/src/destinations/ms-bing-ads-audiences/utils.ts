import { processHashing } from '../../lib/hashing-utils'
import { Payload } from './syncAudiences/generated-types'
import {
  JSONLikeObject,
  MultiStatusResponse,
  RequestClient,
  HTTPError,
  ModifiedResponse,
  IntegrationError,
  PayloadValidationError
} from '@segment/actions-core'
import { BASE_URL } from './constants'
import {
  SyncAudiencePayload,
  PartialError,
  Action,
  Identifier,
  CreateAudienceRequest,
  CreateAudienceResponse
} from './types'

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

/**
 * Handles HTTP errors by parsing the error response and updating the provided `msResponse`
 * object with error details for each affected payload index.
 *
 * @param msResponse - The response object that supports setting error responses at specific indices.
 * @param error - The HTTP error object containing the response to be parsed.
 * @param listItemsMap - A map of payload identifiers to their corresponding indices in the payload array.
 * @param payload - The array of payloads that were attempted to be sent.
 * @returns A promise that resolves when all error responses have been set.
 */
export const handleHttpError = async (
  msResponse: MultiStatusResponse,
  error: HTTPError,
  listItemsMap: Map<string, number[]>,
  payload: Payload[]
): Promise<void> => {
  const errorResponse = await error?.response?.json()
  listItemsMap.forEach((indices) => {
    indices.forEach((index) => {
      msResponse.setErrorResponseAtIndex(index, {
        status: errorResponse?.status,
        errormessage: errorResponse?.message || error.message,
        sent: payload[index] as unknown as JSONLikeObject,
        body: JSON.stringify(errorResponse)
      })
    })
  })
}

// Cap the response body we fold into the error message. Bing (or an intermediary proxy) can
// return large HTML error pages, and the message ends up in logs / downstream payloads.
const MAX_ERROR_BODY_LENGTH = 2048

/**
 * Safely reads the body of an error response from the Bing Ads API for logging.
 *
 * Bing can return an empty or non-JSON body on failures, so this never throws. It prefers the
 * already-parsed `content` that the request client populates (which is robust whether or not the
 * response stream was cloned) and only falls back to re-reading the stream via `text()`. The
 * result is truncated to a sane length, and falls back to an empty string if the body can't be read.
 */
const readResponseBody = async (response?: ModifiedResponse): Promise<string> => {
  if (!response) {
    return ''
  }
  const truncate = (text: string): string =>
    text.length > MAX_ERROR_BODY_LENGTH ? `${text.slice(0, MAX_ERROR_BODY_LENGTH)}...(truncated)` : text

  // `content` is the raw body string the request client already read. Reading it avoids
  // re-consuming the response stream (which throws if it was not cloned — see skipResponseCloning).
  if (typeof response.content === 'string') {
    return truncate(response.content)
  }
  try {
    return truncate((await response.text()) ?? '')
  } catch {
    return ''
  }
}

/**
 * Creates a CustomerList audience in Microsoft Bing Ads and returns its AudienceId.
 *
 * Bing reports create failures in two different ways, both of which are surfaced here with the
 * real cause rather than an opaque error:
 *  - A non-2xx HTTP response (often with an empty or non-JSON body), thrown as an HTTPError.
 *  - A 200 response carrying a PartialErrors array (e.g. duplicate name, terms not accepted).
 *
 * @param request - The HTTP request client used to communicate with Microsoft Bing Ads.
 * @param audienceName - The name of the audience to create.
 * @returns The created AudienceId.
 */
export const createBingAudience = async (request: RequestClient, audienceName?: string): Promise<string> => {
  if (!audienceName) {
    throw new PayloadValidationError('Missing audience name value')
  }

  const json: CreateAudienceRequest = {
    Audiences: [
      {
        Name: audienceName,
        Type: 'CustomerList'
      }
    ]
  }

  let response: CreateAudienceResponse
  try {
    response = await request(`${BASE_URL}/Audiences`, {
      method: 'POST',
      json
    })
  } catch (error) {
    // The request client throws an HTTPError on a non-2xx response. Without this, the raw error
    // escapes untyped and the platform surfaces an opaque "500 / Bad Request" with no detail.
    // Capture Bing's actual status and response body so the real cause is visible in logs.
    if (error instanceof HTTPError) {
      const status = error.response?.status
      const body = await readResponseBody(error.response as ModifiedResponse)
      throw new IntegrationError(
        `Failed to create audience. Microsoft Bing Ads returned HTTP ${status ?? 'unknown'}: ${
          body || 'no response body'
        }`,
        'CREATE_AUDIENCE_FAILED',
        status ?? 400
      )
    }
    throw error
  }

  // Bing returns a 200 with a PartialErrors array (rather than an HTTP error) for most create
  // failures, so any error code here must be surfaced explicitly — otherwise it is silently
  // swallowed and collapses into the opaque "No AudienceId returned" error below.
  if (response?.data?.PartialErrors?.length) {
    const errorObj: PartialError = response.data.PartialErrors[0]

    if (errorObj?.ErrorCode === 'CustomerListTermsAndConditionsNotAccepted') {
      throw new IntegrationError(
        "The Customer Match 'Terms And Conditions' are not yet Accepted in the Microsoft Advertising web UI. Please create a Customer List in the Microsoft Advertising UI to accept the terms.",
        'TERMS_NOT_ACCEPTED',
        400
      )
    }

    // Surface every other PartialError with Bing's own ErrorCode and Message so the real cause
    // (e.g. a duplicate audience name) is visible instead of NO_AUDIENCE_ID.
    throw new IntegrationError(
      `Failed to create audience: ${errorObj?.ErrorCode ?? 'UnknownError'}: ${
        errorObj?.Message ?? 'No error message provided'
      }`,
      errorObj?.ErrorCode ?? 'CREATE_AUDIENCE_FAILED',
      400
    )
  }

  const audienceId = response?.data?.AudienceIds?.[0]
  if (!audienceId) {
    throw new IntegrationError('Failed to create audience: No AudienceId returned', 'NO_AUDIENCE_ID', 400)
  }

  return audienceId
}
