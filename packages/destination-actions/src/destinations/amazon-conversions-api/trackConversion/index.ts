import { ActionDefinition, MultiStatusResponse, JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventData } from '../types'
import { sendEventsRequest, prepareEventData } from '../utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description: 'Send conversion event data to Amazon Events API',
  defaultSubscription: 'type = "track"',
  fields,
  perform: async (request, { payload, settings }) => {
    const eventData = prepareEventData(payload, settings)
    return await sendEventsRequest(request, settings, [eventData], true)
  },

  performBatch: async (request, { settings, payload: payloads }) => {
    const multiStatusResponse = new MultiStatusResponse()
    const validPayloads: EventData[] = []
    const indexMap: number[] = []
      
    payloads.forEach((payload, index) => {
      try {
        const eventData = prepareEventData(payload, settings)
        validPayloads.push(eventData)
        indexMap.push(index)
      } catch (error) {
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
    
    const response = await sendEventsRequest(request, settings, validPayloads, false)

    if (response.ok || response.status === 207) {
      indexMap.forEach((originalIndex, i) => {
        
        // TODO: if the individual event was successful, we can set the success response
        multiStatusResponse.setSuccessResponseAtIndex(originalIndex, {
          status: 200,
          sent: validPayloads[i] as unknown as JSONLikeObject,
          body: {} // TODO: body: should contain the data returned by the API, if any, for this particular successful event. 
        })

        // TODO: if the individial event failed, we set the error response 
        multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
          status: 400, // TODO the status should be taken from the individual response 
          sent: validPayloads[i] as unknown as JSONLikeObject,
          body: {}, // TODO: body: should contain the data returned by the API, if any, for this particular failed event.
          errormessage: 'Amazon API request failed' // TODO: errormessage should be taken from the individual response
        })
      })
    } else {
      indexMap.forEach((originalIndex, i) => {
        multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
          status: response.status,
          sent: validPayloads[i] as unknown as JSONLikeObject,
          errormessage: response.statusText || 'Amazon API request failed'
        })
      })
    }

    return multiStatusResponse
  }
}

export default action
