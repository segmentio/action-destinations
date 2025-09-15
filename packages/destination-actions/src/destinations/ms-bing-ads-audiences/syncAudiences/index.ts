import { ActionDefinition, RequestClient, HTTPError } from '@segment/actions-core'
import { MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { audience_id, batch_size, crm_id, email, enable_batching, identifier_type, operation } from '../fields'
import {
  prepareListItems,
  preparePayload,
  sendDataToMicrosoftBingAds,
  handleMultistatusResponse,
  handleHttpError
} from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audiences',
  description: 'Sync users to Microsoft Bing Ads Audiences',
  fields: {
    audience_id: audience_id,
    identifier_type: identifier_type,
    email: email,
    crm_id: crm_id,
    operation: operation,
    enable_batching: enable_batching,
    batch_size: batch_size
  },
  perform: async (request, { payload }) => {
    return await syncUser(request, [payload], false)
  },

  performBatch: async (request, { payload }) => {
    return await syncUser(request, payload, true)
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
const syncUser = async (request: RequestClient, payload: Payload[], isBatch: boolean) => {
  const msResponse = new MultiStatusResponse()

  if (!Array.isArray(payload) || payload.length === 0) {
    return msResponse
  }
  const identifierType = payload[0]?.identifier_type
  const audienceId = payload[0]?.audience_id
  const action = payload[0]?.operation

  // Validate identifier type
  const listItemsMap = prepareListItems(payload, identifierType, msResponse)

  // If no valid items after validation, return early
  if (listItemsMap.size === 0) {
    return msResponse
  }

  // Get array of valid items
  const validItems = Array.from(listItemsMap.keys())
  const preparedPayload = preparePayload(audienceId, action, identifierType, validItems)

  try {
    // Send data to Microsoft Bing Ads
    const response = await sendDataToMicrosoftBingAds(request, preparedPayload)

    // Handle the multistatus response
    handleMultistatusResponse(msResponse, response, validItems, listItemsMap, payload, isBatch)
  } catch (error) {
    if (!isBatch) {
      throw error
    }
    if (error instanceof HTTPError) {
      await handleHttpError(msResponse, error, listItemsMap, payload)
    } else {
      throw error
    }
  }

  return msResponse
}

export default action
