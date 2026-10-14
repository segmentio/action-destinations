import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { anonymousId, messageId, timestamp, userId } from '../fields'
import { flattenValues, optionalString, requiredString, send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Send a group event to Inflection to link a user to an organization.',
  defaultSubscription: 'type = "group"',
  fields: {
    userId,
    anonymousId,
    messageId,
    timestamp,
    groupId: {
      label: 'Group ID',
      description: 'The unique identifier of the group.',
      type: 'string',
      required: true,
      default: { '@path': '$.groupId' }
    },
    traits: {
      label: 'Traits',
      description: 'Traits of the group. Nested objects and arrays are sent as JSON strings.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.traits' }
    }
  },
  perform: (request, { settings, payload }) => {
    const anonymousId = optionalString(payload.anonymousId)
    const traits = flattenValues(payload.traits)
    return send(request, settings, {
      type: 'group',
      userId: requiredString(payload.userId, 'User ID'),
      groupId: requiredString(payload.groupId, 'Group ID'),
      messageId: requiredString(payload.messageId, 'Message ID'),
      timestamp: payload.timestamp,
      ...(anonymousId ? { anonymousId } : {}),
      ...(traits ? { traits } : {})
    })
  }
}

export default action
