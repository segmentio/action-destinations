import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DawnEvent } from '../dawn-types'

const getEventFromPayload = (payload: Payload): DawnEvent => {
  const event: DawnEvent = {
    event: payload.event,
    user_id: payload.user_id || '',
    properties: payload.properties || {}
  }
  return event
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const events = payload.map((value) => getEventFromPayload(value))
  return request('https://api.dawnai.com/segment-track', {
    method: 'post',
    json: events,
    headers: {
      authorization: `Bearer ${settings.writeKey}`
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track regular or AI events in Dawn, adding desired data to properties',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the action being performed.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    user_id: {
      label: 'User ID',
      type: 'string',
      description: 'The user ID performing the event.',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    properties: {
      label: 'Properties',
      type: 'object',
      description: 'The properties of the event.',
      required: false,
      default: {
        '@path': '$.properties'
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Use Dawn AI Batching',
      description: 'When enabled, the action will use batch requests to the Dawn AI API',
      required: true,
      default: true
    }
  },

  perform: async (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return processData(request, settings, payload)
  }
}

export default action
