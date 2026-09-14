import { ActionDefinition, MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventData, EventMultiStatusResponse } from '../types'
import {
  sendEventsRequest,
  handleBatchResponse,
  prepareEventData,
  handleResponse,
  FLAGON_THROW_HTTP_ERRORS
} from './utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description: 'Send conversion event data to Amazon Events API',
  defaultSubscription: 'type = "track"',
  fields,

  perform: async (request, { payload, settings, features }) => {
    const eventData = prepareEventData(payload, settings)
    // STRATCONN-6978: behind this flag, a non-2xx response throws instead of being silently
    // reported as a successful delivery, restoring the pre-existing OAuth re-auth/retry path.
    // performBatch is intentionally unaffected - it already handles this correctly.
    const throwHttpErrors = Boolean(features?.[FLAGON_THROW_HTTP_ERRORS])
    const response = await sendEventsRequest<EventMultiStatusResponse>(request, settings, eventData, throwHttpErrors)
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

    const response = await sendEventsRequest<EventMultiStatusResponse>(request, settings, validPayloads)

    return handleBatchResponse(response, validPayloads, validPayloadIndicesBitmap, multiStatusResponse)
  }
}

export default action
