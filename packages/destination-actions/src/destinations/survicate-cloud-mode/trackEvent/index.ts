import { IntegrationError, ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'cloud',
  defaultSubscription: 'type = "track"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'An anonymous user id',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    name: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A JSON object containing additional information about the event that will be indexed by FullStory.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    timestamp: {
      type: 'string',
      required: false,
      description: 'The timestamp of the event. Defaults to current time if not provided.',
      label: 'Timestamp',
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { payload }) => {
    const { userId, anonymousId, name, properties, timestamp } = payload

    if (!userId && !anonymousId) {
      throw new IntegrationError('User ID or Anonymous ID is required', 'Missing required field', 400)
    }

    if (!name) {
      throw new IntegrationError('Name is required', 'Missing required field', 400)
    }

    const eventTimestamp = timestamp || new Date().toISOString()

    return request(`https://panel-api.survicate.com/integrations-api/endpoint/segment/track`, {
      method: 'post',
      json: {
        name,
        ...(properties !== undefined && { properties }),
        timestamp: eventTimestamp
      }
    })
  }
}

export default action
