import { ActionDefinition, MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventData, ImportConversionEventsResponse } from '../types'
import { sendEventsRequest, handleBatchResponse, prepareEventData, handleResponse } from './utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description: 'Send conversion event data to Amazon Events API',
  defaultSubscription: 'type = "track"',
  fields,

  perform: async (request, { payload, settings }) => {
    const eventData = prepareEventData(payload, settings)
    const response = await sendEventsRequest<ImportConversionEventsResponse>(request, settings, eventData)
    return handleResponse(response)
  },

  performBatch: async (request, { settings, payload: payloads }) => {
    const multiStatusResponse = new MultiStatusResponse()
    const validPayloads: EventData[] = []
    const validPayloadIndicesBitmap: number[] = []

    payloads.forEach((payload, index) => {
      try {
        const eventData = prepareEventData(payload, settings)
        validPayloads.push(eventData)
        validPayloadIndicesBitmap.push(index)
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

    const response = await sendEventsRequest<ImportConversionEventsResponse>(request, settings, validPayloads)

    return handleBatchResponse(response, validPayloads, validPayloadIndicesBitmap, multiStatusResponse)
  }
}

export default action
