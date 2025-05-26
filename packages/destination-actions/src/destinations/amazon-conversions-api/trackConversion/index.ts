import { ActionDefinition } from '@segment/actions-core'
import { MultiStatusResponse } from '@segment/actions-core'
import { JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventData, AmazonApiResponse } from '../types'
import { sendEventsRequest, handleAmazonApiError, prepareEventData } from '../utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description: 'Send conversion event data to Amazon Events API',
  defaultSubscription: 'type = "track"',
  fields,
  perform: async (request, { payload, settings }) => {
    const eventData = prepareEventData(payload, settings)
    const response = await sendEventsRequest<AmazonApiResponse>(request, settings, [eventData])
    if (response.ok || response.status === 207) {
      return response
    }    
    throw handleAmazonApiError(response)
  },

  /**
   * Process the batch of payloads
   */
  performBatch: async (request, { settings, payload: payloads }) => {
    const multiStatusResponse = new MultiStatusResponse()
    const validPayloads: EventData[] = []
    const validPayloadIndicesBitmap: number[] = []
    
    // Process each payload and prepare for batching
    payloads.forEach((payload, index) => {
      try {
        // Try to prepare the event data - reuse logic from perform()
        const eventData = prepareEventData(payload, settings)
        validPayloads.push(eventData)
        validPayloadIndicesBitmap.push(index)
      } catch (error) {
        // Handle validation errors immediately
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: error.status || 400,
          errortype: error.code || 'PAYLOAD_VALIDATION_FAILED',
          errormessage: error.message || 'Validation failed'
        })
      }
    })
    
    if (validPayloads.length === 0) {
      return multiStatusResponse
    }
    
    try {
      // Send the batch to Amazon API using the shared function
      const response = await sendEventsRequest(request, settings, validPayloads)
      
      if (response.ok || response.status === 207) {
        return handleBatchResponse(response, validPayloads, validPayloadIndicesBitmap, multiStatusResponse)
      }
      
      // Get detailed error information without throwing
      const apiError = handleAmazonApiError(response)
      
      // Apply the specific error details to each payload in the batch
      validPayloadIndicesBitmap.forEach((index) => {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: apiError.status || 400,
          errormessage: apiError.message,
          body: response.data
        })
      })
      
      return multiStatusResponse
    } catch (error) {
      // Handle truly unexpected errors (like network issues)
      // This should only happen for errors not related to the API response
      validPayloadIndicesBitmap.forEach((index) => {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 500,
          errormessage: error.message || 'Unknown error occurred during request processing'
        })
      })
      
      return multiStatusResponse
    }
  }
}

/**
 * Process the Amazon API response and update the multi-status response
 */
function handleBatchResponse(
  response: any,
  validPayloads: EventData[],
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse
): MultiStatusResponse {
  // No need to check response.ok || response.status === 207
  // because we only call this function when that condition is true
  
  // Handle success or partial success
  validPayloads.forEach((payload, index) => {
    const originalIndex = validPayloadIndicesBitmap[index]
    multiStatusResponse.setSuccessResponseAtIndex(originalIndex, {
      status: 200,
      sent: payload as unknown as JSONLikeObject,
      body: response.data || 'success'
    })
  })

  return multiStatusResponse
}


export default action
