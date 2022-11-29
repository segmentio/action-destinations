import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getEndpointByRegion } from '../regional-endpoints'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties.',
  defaultSubscription: 'type = "identify"',
  fields: {
    type: {
      label: 'Event type',
      type: 'string',
      description: 'The type of the event being performed.',
      required: true,
      default: {
        '@path': '$.type'
      }
    },
    userId: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description: 'The unique user identifier set by you',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      type: 'string',
      allowNull: true,
      description: 'The generated anonymous ID for the user',
      default: {
        '@path': '$.anonymousId'
      }
    },
    os_name: {
      label: 'OS Name',
      type: 'string',
      description: 'The name of the mobile operating system or browser that the user is using.',
      default: {
        '@path': '$.context.os.name'
      }
    },
    app_version: {
      label: 'APP Version',
      type: 'string',
      description: 'The version of the mobile operating system or browser the user is using.',
      default: {
        '@path': '$.context.app.version'
      }
    },
    library_version: {
      label: 'Library Version',
      type: 'string',
      description: 'The version of the mobile operating system or browser the user is using.',
      default: {
        '@path': '$.context.library.version'
      }
    },
    timestamp: {
      label: 'Timestamp',
      type: 'datetime',
      description:
        'The timestamp of the event. If time is not sent with the event, it will be set to the time our servers receive it.',
      default: {
        '@path': '$.timestamp'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description: 'Properties to set on the user profile',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    if (!settings.api_id || !settings.api_key) {
      throw new IntegrationError('Missing API ID or API KEY', 'Missing required field', 400)
    }

    const event = {
      type: payload.type,
      user_id: payload.userId,
      traits: payload.traits,
      context: {
        app: { version: payload.app_version },
        os: { name: payload.os_name },
        library: { version: payload.library_version }
      },
      anonymous_id: payload.anonymousId,
      timestamp: payload.timestamp
    }

    const endpoint = getEndpointByRegion(settings.region)

    return request(`${endpoint}/v1/integrations/segment?appId=${settings.api_id}`, {
      method: 'post',
      json: event,
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.api_id}:${settings.api_key}`).toString('base64')}`
      }
    })
  }
}

export default action
