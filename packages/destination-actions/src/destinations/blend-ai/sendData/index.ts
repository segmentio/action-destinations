import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { BASE_URL } from '../consts'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to Blend AI for product usage insights',
  fields: {
    eventType: {
      label: 'Event Type',
      description: 'The type of event',
      type: 'string'
    },
    eventProperties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object'
    }
  },
  defaultSubscription: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
  perform: (request, { payload }) =>
    request(BASE_URL + 'sendData', {
      method: 'POST',
      json: {
        type: payload.eventType,
        properties: payload.eventProperties
      }
    })
}

export default action
