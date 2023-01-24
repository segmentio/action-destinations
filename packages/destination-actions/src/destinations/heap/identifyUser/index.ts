import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { getHeapUserId } from '../userIdHash'
import { flat } from '../flat'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties.',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description:
        'An identity, typically corresponding to an existing user. If no such identity exists, then a new user will be created with that identity. Case-sensitive string, limited to 255 characters.',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      type: 'string',
      allowNull: true,
      description: 'The generated anonymous ID for the user.',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description:
        'An object with key-value properties you want associated with the user. Each key and property must either be a number or string with fewer than 1024 characters.',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    if (!settings.appId) {
      throw new IntegrationError('Missing Heap app ID.', 'Missing required field', 400)
    }

    const responses = []

    if (payload.anonymous_id) {
      const data = {
        app_id: settings.appId,
        identity: payload.user_id,
        user_id: getHeapUserId(payload.anonymous_id)
      }
      const identifyResponse = await request('https://heapanalytics.com/api/v1/identify', {
        method: 'post',
        json: data
      })
      responses.push(identifyResponse)
    }
    if (payload.traits && Object.keys(payload.traits).length > 0) {
      const flatten = flat(payload.traits)
      const data = {
        app_id: settings.appId,
        identity: payload.user_id,
        properties: flatten
      }

      const addUserPropertiesEndpoint = request('https://heapanalytics.com/api/add_user_properties', {
        method: 'post',
        json: data
      })
      responses.push(addUserPropertiesEndpoint)
    }
    return Promise.all(responses)
  }
}

export default action
