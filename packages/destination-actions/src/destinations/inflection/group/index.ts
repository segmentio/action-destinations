import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { anonymousId, messageId, timestamp, userId, nestedValueHandling } from '../fields'
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
    nestedValueHandling,
    traits: {
      label: 'Traits',
      description: 'Traits of the group.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.traits' }
    }
  },
  perform: (request, { settings, payload }) => {
    const { userId, groupId, messageId, timestamp, anonymousId, traits, nestedValueHandling } = payload

    const validUserId = requiredString(userId, 'User ID')
    const validGroupId = requiredString(groupId, 'Group ID')
    const validMessageId = requiredString(messageId, 'Message ID')
    const validAnonymousId = optionalString(anonymousId)
    const flatTraits = flattenValues(traits, {
      objects: nestedValueHandling?.objectHandling,
      arrays: nestedValueHandling?.arrayHandling
    })

    return send(request, settings, {
      type: 'group',
      userId: validUserId,
      groupId: validGroupId,
      messageId: validMessageId,
      timestamp,
      ...(validAnonymousId ? { anonymousId: validAnonymousId } : {}),
      ...(flatTraits ? { traits: flatTraits } : {})
    })
  }
}

export default action
