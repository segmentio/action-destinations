import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to Moengage.',
  defaultSubscription: 'type = "track"',
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
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the event being performed.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    userId: {
      label: 'User ID',
      type: 'string',
      description: 'The unique identifier of the user.',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      type: 'string',
      description: 'The unique identifier of the anonymous user.',
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
    properties: {
      label: 'Event Properties',
      type: 'object',
      description: 'An object of key-value pairs that represent event properties to be sent along with the event.',
      default: {
        '@path': '$.properties'
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
      anonymous_id: payload.anonymousId,
      event: payload.event,
      context: {
        app: { version: payload.app_version },
        os: { name: payload.os_name },
        library: { version: payload.library_version }
      },
      properties: payload.properties,
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
