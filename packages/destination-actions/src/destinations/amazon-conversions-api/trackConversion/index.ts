import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventData, ImportConversionEventsResponse } from '../types'
import { MultiStatusResponse, JSONLikeObject } from '@segment/actions-core'
import {
  sendEventsRequest,
  handleBatchResponse,
  prepareEventData
} from './utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description: 'Send conversion event data to Amazon Events API',
  defaultSubscription: 'type = "track"',
  fields,

  perform: async (request, { payload, settings }) => {
    const eventData = prepareEventData(payload, settings)
    return await sendEventsRequest<ImportConversionEventsResponse>(request, settings, eventData, true)
  },

  performBatch: async (request, { settings, payload: payloads }) => {
    const multiStatusResponse = new MultiStatusResponse()
    const validPayloads: EventData[] = []
    const validPayloadIndicesBitmap: number[] = []

    // Process each payload and prepare for batching
    payloads.forEach((payload, index) => {
      try {
        const eventData = prepareEventData(payload, settings)
        validPayloads.push(eventData)
        validPayloadIndicesBitmap.push(index)
      } catch (error) {
        // Handle validation errors immediately
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: error?.status || 400,
          errortype: error?.code || 'PAYLOAD_VALIDATION_FAILED',
          errormessage: error?.message || 'Validation failed'
        })
      }
    })

    if (validPayloads.length === 0) {
      return multiStatusResponse
    }

    try {
      // Send the batch to Amazon API using the shared function
      const response = await sendEventsRequest<ImportConversionEventsResponse>(request, settings, validPayloads, false)

      if (response.status === 207) {
        return handleBatchResponse(response, validPayloads, validPayloadIndicesBitmap, multiStatusResponse)
      }

      // Apply the specific error details to each payload in the batch
      validPayloadIndicesBitmap.forEach((originalIndex, arrayPosition) => {
        multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
          status: response.status || 400,
          errormessage: response.statusText || 'Amazon API request failed',
          sent: validPayloads[arrayPosition] as unknown as JSONLikeObject,
        })
      })

      return multiStatusResponse
    } catch (error) {
      validPayloadIndicesBitmap.forEach((index) => {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 500,
          errormessage: error?.message || 'Unknown error occurred during request processing'
        })
      })

      return multiStatusResponse
    }
  }
}

export default action
