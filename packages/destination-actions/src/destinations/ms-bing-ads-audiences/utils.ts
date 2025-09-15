import { processHashing } from '../../lib/hashing-utils'
import { Payload } from './syncAudiences/generated-types'
import {
  ErrorCodes,
  JSONLikeObject,
  MultiStatusResponse,
  RequestClient,
  HTTPError,
  ModifiedResponse,
  IntegrationError
} from '@segment/actions-core'
import { BASE_URL } from './constants'
import { syncAudiencePayload, PartialError } from './types'

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
 * Prepares a map of list items based on the provided payload and identifier type.
 *
 * Iterates over the payload array and, depending on the `identifierType`, either hashes the email or uses the CRM ID as the key.
 * If the required identifier is missing in an item, sets an error response at the corresponding index in the `msResponse`.
 *
 * @param payload - An array of payload objects containing user data.
 * @param identifierType - The type of identifier to use ('Email' or 'CRM').
 * @param msResponse - The response object used to set error responses for invalid items.
 * @returns A map where the key is the hashed email or CRM ID and the value is the index of the item in the payload.
 */
export const prepareListItems = (
  payload: Payload[],
  identifierType: string,
  msResponse: MultiStatusResponse
): Map<string, number> => {
  const listItemsMap = new Map<string, number>()

  payload.forEach((item, index) => {
    const { email, crm_id } = item
    if (identifierType === 'Email') {
      if (!email) {
        msResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: ErrorCodes.BAD_REQUEST,
          errormessage: 'Email is required when Identifier Type is set to Email',
          sent: item as unknown as JSONLikeObject
        })
      } else {
        listItemsMap.set(hashEmail(email), index)
      }
    }
    if (identifierType === 'CRM') {
      if (!crm_id) {
        msResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: ErrorCodes.BAD_REQUEST,
          errormessage: 'CRM ID is required when Identifier Type is set to CRM ID',
          sent: item as unknown as JSONLikeObject
        })
      } else {
        listItemsMap.set(crm_id, index)
      }
    }
  })

  return listItemsMap
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
  action: string,
  identifierType: string,
  listItems: string[]
): syncAudiencePayload => {
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
export const sendDataToMicrosoftBingAds = async (request: RequestClient, payload: syncAudiencePayload) => {
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
 * @param validItems - An array of item identifiers that were sent in the request.
 * @param listItemsMap - A map from item identifiers to their original indices in the payload.
 * @param payload - The original payload array sent to the API.
 * @param isBatch - Indicates whether the operation is being performed in batch mode. If false, a partial error will throw an IntegrationError.
 */
export const handleMultistatusResponse = (
  msResponse: MultiStatusResponse,
  response: ModifiedResponse,
  validItems: string[],
  listItemsMap: Map<string, number>,
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
      if (typeof error.Index === 'number' && error.Index >= 0 && error.Index < validItems.length) {
        const item = validItems[error.Index]
        const originalIndex = listItemsMap.get(item)

        if (originalIndex !== undefined) {
          msResponse.setErrorResponseAtIndex(originalIndex, {
            status: error.Code || 400,
            errormessage: `${error.ErrorCode ?? 'UnknownError'}: ${error.Message ?? 'No error message provided'}`,
            sent: payload[originalIndex] as unknown as JSONLikeObject,
            body: JSON.stringify(error)
          })

          // Remove this item from the list of items to be marked as successful
          listItemsMap.delete(item)
        }
      }
    })
  }

  // Mark all remaining items as successful
  listItemsMap.forEach((index) => {
    msResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      sent: payload[index] as unknown as JSONLikeObject,
      body: JSON.stringify(response?.data) || 'Success'
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
  listItemsMap: Map<string, number>,
  payload: Payload[]
): Promise<void> => {
  const errorResponse = await error?.response?.json()
  listItemsMap.forEach((index) => {
    msResponse.setErrorResponseAtIndex(index, {
      status: errorResponse?.status,
      errormessage: errorResponse?.message || error.message,
      sent: payload[index] as unknown as JSONLikeObject,
      body: JSON.stringify(errorResponse)
    })
  })
}
