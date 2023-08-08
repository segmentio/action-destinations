import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      description: 'The name of the event.',
      label: 'Event name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'A JSON object containing the properties of the event.',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    ...commonFields
  },
  perform: (request, { payload }) => {
    return request('https://z17lngdoxi.execute-api.us-west-2.amazonaws.com/Prod/event', {
      method: 'post',
      json: payload
    })
  }
}

export default action
