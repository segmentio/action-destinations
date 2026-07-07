import { ActionDefinition, MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { QuoraConversionItem } from '../types'
import { sendEvents, buildConversionItem, handleBatchResponse, assertSingleEventSucceeded } from '../utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description:
    'Send a conversion event to Quora. Supports all standard Quora conversion types, plus Generic pass-through of the Segment event name.',
  defaultSubscription: 'type = "track"',
  fields,

  perform: async (request, { payload, settings }) => {
    const item = buildConversionItem(payload)
    const response = await sendEvents(request, settings, [item], false)
    assertSingleEventSucceeded(response)
    return response
  },

  performBatch: async (request, { payload: payloads, settings }) => {
    const multiStatusResponse = new MultiStatusResponse()
    const validItems: QuoraConversionItem[] = []
    const validPayloadIndices: number[] = []

    payloads.forEach((payload, index) => {
      try {
        validItems.push(buildConversionItem(payload))
        validPayloadIndices.push(index)
      } catch (error) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: error?.status || 400,
          errortype: error?.code || 'PAYLOAD_VALIDATION_FAILED',
          errormessage: error?.message || 'Validation failed'
        })
      }
    })

    if (validItems.length === 0) {
      return multiStatusResponse
    }

    const response = await sendEvents(request, settings, validItems, true)
    return handleBatchResponse(response, validItems, validPayloadIndices, multiStatusResponse)
  }
}

export default action
