import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DawnIdentifyUser } from '../dawn-types'

const getEventFromPayload = (payload: Payload): DawnIdentifyUser => {
  const identifyUserPayload: DawnIdentifyUser = {
    user_id: payload.user_id || '',
    traits: payload.traits || {}
  }
  return identifyUserPayload
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const identifyUsers = payload.map((value) => getEventFromPayload(value))
  return request('https://api.dawnai.com/segment-identify', {
    method: 'post',
    json: identifyUsers,
    headers: {
      authorization: `Bearer ${settings.writeKey}`
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Identify a user in Dawn and associate traits with them.',
  fields: {
    user_id: {
      label: 'User ID',
      type: 'string',
      description: 'The ID of the user performing the event.',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      label: 'Traits',
      type: 'object',
      description: 'The traits of the user.',
      required: false,
      default: {
        '@path': '$.traits'
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
