import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { flat } from '../flat'
import { isDefined } from '../heapUtils'

type AddUserPropertiesPayload = {
  app_id: string
  identity: string
  properties: {
    [k: string]: string
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties.',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id: {
      label: 'Identity',
      type: 'string',
      allowNull: true,
      description:
        'REQUIRED: A string that uniquely identifies a user, such as an email, handle, or username. This means no two users in one environment may share the same identity. More on identify: https://developers.heap.io/docs/using-identify',
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

    if (!payload.user_id || !isDefined(payload.user_id)) {
      throw new IntegrationError(
        'Missing identity, cannot add user properties without identity',
        'Missing required field',
        400
      )
    }

    const addUserPropertiesPayload: AddUserPropertiesPayload = {
      identity: payload.user_id,
      app_id: settings.appId,
      properties: {
        ...(payload.anonymous_id && { anonymous_id: payload.anonymous_id })
      }
    }

    if (payload.traits && Object.keys(payload.traits).length > 0) {
      const flatten = flat(payload.traits)
      addUserPropertiesPayload.properties = {
        ...addUserPropertiesPayload.properties,
        ...flatten
      }
    }

    return request('https://heapanalytics.com/api/add_user_properties', {
      method: 'post',
      json: addUserPropertiesPayload
    })
  }
}

export default action
