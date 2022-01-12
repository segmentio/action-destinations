import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to Gainsight PX',
  defaultSubscription: 'type = "track"',
  fields: {
    segmentEvent: {
      label: 'Segment Event',
      type: 'object',
      description: 'The raw Segment event',
      required: true,
      default: {
        '@path': '$event'
      }
    }
  },
  perform: (request, { payload, settings }) => {

    return request(getEndpointByRegion('track', settings.dataCenter), {
      method: 'post',
      json: payload.segmentEvent
    })
  }
}

export default action
