import { ActionDefinition, RequestClient, HTTPError } from '@segment/actions-core'
import { MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { audience_id, traits_or_props, audience_key, batch_size, crm_id, email, enable_batching, identifier_type, computation_class } from './fields'
import {
  preparePayload,
  sendDataToMicrosoftBingAds,
  handleMultistatusResponse,
  handleHttpError
} from '../utils'
import { ActionType, SyncAudiencePayload } from '../types'

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
  
  // Identifier type is static for every batch as it's set in the batch keys array
  const identifierType = payload[0]?.identifier_type

  // Audience ID value is static for every batch as it's set in the batch keys array
  const audienceId = payload[0]?.audience_id

  const addMap: Map<string, number> = new Map()
  const removeMap: Map<string, number> = new Map()

  payload.forEach((p, index) => {
    const action: ActionType = p.traits_or_props[p.audience_key] ? 'Add' : 'Remove'
    const identifier: string = (p.identifier_type === 'Email' ? p.email : p.crm_id) as string

    if(action === 'Add') {
      addMap.set(identifier, index)
    } else {
      removeMap.set(identifier, index)
    }
  })

  const addJSON: SyncAudiencePayload = preparePayload(
    audienceId,
    'Add',
    identifierType,
    Array.from(addMap.keys())
  )

  const removeJSON: SyncAudiencePayload = preparePayload(
    audienceId,
    'Remove',
    identifierType,
    Array.from(removeMap.keys())
  )


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
