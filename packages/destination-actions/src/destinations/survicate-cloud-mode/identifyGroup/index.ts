import { IntegrationError, ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Group',
  description: '',
  fields: {
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
    if (!payload.groupId) {
      throw new IntegrationError('Group ID is required', 'Missing required field', 400)
    }

    if (!payload.traits) {
      throw new IntegrationError('Traits are required', 'Missing required field', 400)
    }

    const groupTraits = Object.fromEntries(
      Object.entries(payload.traits).map(([key, value]) => [`group_${key}`, value])
    )

    const eventTimestamp = payload.timestamp || new Date().toISOString()

    return request(`https://integrations.survicate.com/endpoint/segment/group`, {
      method: 'post',
      json: {
        groupId: payload.groupId,
        traits: groupTraits,
        timestamp: eventTimestamp
      }
    })
  }
}

export default action
