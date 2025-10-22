import { IntegrationError, ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Group',
  description: 'Send group traits to Survicate',
  defaultSubscription: 'type = "group"',
  platform: 'cloud',
  fields: {
    userId: {
      type: 'string',
      required: true,
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
    groupId: {
      type: 'string',
      required: true,
      description: 'The group id',
      label: 'Group ID',
      default: { '@path': '$.groupId' }
    },
    traits: {
      type: 'object',
      required: true,
      description: 'The Segment traits to be forwarded to Survicate',
      label: 'Group traits',
      default: { '@path': '$.traits' }
    },
    timestamp: {
      type: 'string',
      required: false,
      description: 'The timestamp of the event. Defaults to current time if not provided',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    }
  },
  perform: (request, { payload }) => {
    const { userId, anonymousId, groupId, traits, timestamp } = payload

    if (!userId && !anonymousId) {
      throw new IntegrationError('User ID or Anonymous ID is required', 'Missing required field', 400)
    }

    if (!groupId) {
      throw new IntegrationError('Group ID is required', 'Missing required field', 400)
    }

    if (!traits) {
      throw new IntegrationError('Traits are required', 'Missing required field', 400)
    }

    const groupTraits = Object.fromEntries(Object.entries(traits).map(([key, value]) => [`group_${key}`, value]))

    const eventTimestamp = timestamp || new Date().toISOString()

    return request(`https://integrations.survicate.com/endpoint/segment/group`, {
      method: 'post',
      json: {
        ...(anonymousId !== undefined && { anonymousId }),
        ...(userId !== undefined && { userId }),
        groupId,
        traits: groupTraits,
        timestamp: eventTimestamp
      }
    })
  }
}

export default action
