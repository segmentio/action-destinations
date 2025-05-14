import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Page View',
  description: 'Forward page view event to RoadwayAI.',
  defaultSubscription: 'type = "page"',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to RoadwayAI',
      description: 'When enabled, the action will use the RoadwayAI batch API.',
      unsafe_hidden: true,
      default: true
    },
    id: {
      label: 'Person ID',
      description: 'The ID used to uniquely identify a person in RoadwayAI.',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'An anonymous ID for when no Person ID exists.',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    event_id: {
      label: 'Event ID',
      description: 'An optional identifier used to deduplicate events.',
      type: 'string',
      default: {
        '@path': '$.messageId'
      }
    },
    url: {
      label: 'Page URL',
      description: 'The URL of the page visited.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.url'
      }
    },
    referrer: {
      type: 'string',
      allowNull: true,
      description: 'The page referrer',
      label: 'Page Referrer',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.referrer' },
          then: { '@path': '$.context.page.referrer' },
          else: { '@path': '$.properties.referrer' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'A timestamp of when the event took place. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    data: {
      label: 'Event Attributes',
      description: 'Optional data to include with the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    return request(`https://app.roadwayai.com/api/v1/segment/events/page`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: [payload]
    })
  },

  performBatch: async (request, { settings, payload }) => {
    return request(`https://app.roadwayai.com/api/v1/segment/events/page`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey
      },
      json: payload
    })
  }
}

export default action
