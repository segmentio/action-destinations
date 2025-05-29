import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { eventProperties } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to RoadwayAI.',
  defaultSubscription: 'type = "track"',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to RoadwayAI',
      description: 'When enabled, the action will use the RoadwayAI batch API.',
      unsafe_hidden: true,
      default: true
    },
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the action being performed.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    ...eventProperties
  },
  perform: async (request, { settings, payload }) => {
    return request(`https://app.roadwayai.com/api/v1/segment/events/track`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [payload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    return request(`https://app.roadwayai.com/api/v1/segment/events/track`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: payload
    })
  }
}

export default action
