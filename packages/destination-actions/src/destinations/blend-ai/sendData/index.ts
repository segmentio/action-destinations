import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const baseUrl = 'https://segment-api.blnd.ai/'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to Blend AI for product usage insights',
  fields: {
    eventType: {
      label: 'Event Type',
      description: 'The type of event',
      type: 'string',
      required: true
    },
    eventProperties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object',
      required: true
    }
  },
  defaultSubscription: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
  perform: (request, { payload }) => {
    return request(baseUrl + 'sendData', {
      method: 'POST',
      json: {
        type: payload.eventType,
        properties: payload.eventProperties
      }
    })
  }
}

export default action
