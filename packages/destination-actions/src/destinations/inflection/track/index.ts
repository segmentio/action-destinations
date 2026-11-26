import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  anonymousId,
  audienceDetails,
  email,
  engageAudienceKey,
  groupId,
  messageId,
  nestedValueHandling,
  sendIdentify,
  syncMode,
  timestamp,
  traits,
  userId
} from '../fields'
import { buildAttributes, buildIdentifyJSON, optionalString, requiredString, send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send a track event to Inflection.',
  defaultSubscription: 'type = "track"',
  syncMode,
  fields: {
    userId,
    anonymousId,
    event: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    messageId,
    timestamp,
    groupId,
    sendIdentify,
    email: { ...email, required: false, default: { '@path': '$.context.traits.email' } },
    traits: { ...traits, default: { '@path': '$.context.traits' } },
    nestedValueHandling,
    properties: {
      label: 'Properties',
      description: 'Properties of the event.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.properties' }
    },
    audienceDetails,
    engageAudienceKey
  },
  perform: async (request, { settings, payload, audienceMembership }) => {
    const { userId, event, messageId, timestamp, email, anonymousId, groupId, sendIdentify, properties } = payload

    const validUserId = requiredString(userId, 'User ID')
    const validEvent = requiredString(event, 'Event Name')
    const validMessageId = requiredString(messageId, 'Message ID')
    const validEmail = optionalString(email)
    const validAnonymousId = optionalString(anonymousId)
    const validGroupId = optionalString(groupId)
    const attributes = buildAttributes(properties, payload, audienceMembership)

    if (sendIdentify && validEmail) {
      await send(
        request,
        settings,
        buildIdentifyJSON(payload, validEmail, `${validMessageId}-identify`, audienceMembership)
      )
    }

    return send(request, settings, {
      type: 'track',
      userId: validUserId,
      event: validEvent,
      messageId: validMessageId,
      timestamp,
      ...(validAnonymousId ? { anonymousId: validAnonymousId } : {}),
      ...(attributes ? { properties: attributes } : {}),
      ...(validGroupId ? { context: { groupId: validGroupId } } : {})
    })
  }
}

export default action
