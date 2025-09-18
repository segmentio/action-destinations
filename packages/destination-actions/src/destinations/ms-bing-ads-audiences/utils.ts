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
import { SyncAudiencePayload, PartialError, Action, Identifier } from './types'

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
