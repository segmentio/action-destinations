import { IntegrationError, ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Sets user identity variables',
  platform: 'cloud',
  defaultSubscription: 'type = "identify"',
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
      description: 'An anonymous id',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      type: 'object',
      required: true,
      description: 'The Segment traits to be forwarded to Survicate',
      label: 'Traits',
      default: {
        '@path': '$.traits'
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
    const { traits, anonymousId, userId, timestamp } = payload

    if (!userId && !anonymousId) {
      throw new IntegrationError('User ID or Anonymous ID is required', 'Missing required field', 400)
    }

    if (!traits) {
      throw new IntegrationError('Traits are required', 'Missing required field', 400)
    }

    const eventTimestamp = timestamp || new Date().toISOString()

    return request(`https://panel-api.survicate.com/integrations-api/endpoint/segment/identify`, {
      method: 'post',
      json: {
        ...(anonymousId !== undefined && { anonymousId }),
        ...(userId !== undefined && { userId }),
        timestamp: eventTimestamp,
        traits
      }
    })
  }
}

export default action
