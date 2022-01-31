import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'
import { commonFields } from "../common-fields";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to Gainsight PX',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'A unique identifier for your event.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Properties',
      type: 'object',
      description: 'An object of key-value pairs that represent additional data to be sent along with the event.',
      default: {
        '@path': '$.properties'
      }
    },
    ...commonFields
  },
  perform: (request, { payload, settings }) => {

    return request(getEndpointByRegion('track', settings.dataCenter), {
      method: 'post',
      json: payload
    })
  }
}

export default action
