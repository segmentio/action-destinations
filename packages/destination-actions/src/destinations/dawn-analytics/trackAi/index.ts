import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DawnEvent } from '../dawn-types'

const getEventFromPayload = (payload: Payload): DawnEvent => {
  const event: DawnEvent = {
    event: payload.event,
    properties: payload.properties || {}
  }
  return event
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const events = payload.map((value) => getEventFromPayload(value))
  return request('https://api.dawnai.com/track-ai', {
    method: 'post',
    json: events,
    headers: {
      authorization: `Bearer ${settings.writeKey}`
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Ai',
  description: '',
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
    properties: {
      label: 'Properties',
      type: 'object',
      description: 'The properties of the event.',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  }
}

export default action
