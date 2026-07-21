import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send track events (bookings, leads, page views) to Collab Travel CRM.',
  defaultSubscription: 'type = "track"',

  fields: {
    eventName: {
      label: 'Event Name',
      description: 'The name of the event (e.g., "Trip Booked", "Lead Created").',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'Additional properties associated with the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    userId: {
      label: 'User ID',
      description: 'The unique identifier for the user.',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'An anonymous identifier when User ID is not available.',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event.',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    }
  },

  perform: async (request, { payload }) => {
    const body = {
      type: 'track',
      event: payload.eventName,
      userId: payload.userId,
      anonymousId: payload.anonymousId,
      properties: payload.properties,
      timestamp: payload.timestamp
    }

    return request(`${COLLAB_CRM_BASE_URL}/segment-destination`, {
      method: 'POST',
      json: body
    })
  }
}

export default action
