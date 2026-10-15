import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  anonymousId,
  audienceDetails,
  engageAudienceKey,
  messageId,
  nestedValueHandling,
  syncMode,
  timestamp,
  userId
} from '../fields'
import { buildAttributes, optionalString, requiredString, send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Send an identify event to Inflection to create or update a contact.',
  defaultSubscription: 'type = "identify"',
  syncMode,
  fields: {
    userId,
    anonymousId,
    messageId,
    timestamp,
    email: {
      label: 'Email',
      description: 'The email address of the user.',
      type: 'string',
      format: 'email',
      required: true,
      default: { '@path': '$.traits.email' }
    },
    nestedValueHandling,
    traits: {
      label: 'Traits',
      description: 'Traits of the user.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.traits' }
    },
    audienceDetails,
    engageAudienceKey
  },
  perform: (request, { settings, payload, audienceMembership }) => {
    const anonymousId = optionalString(payload.anonymousId)
    return send(request, settings, {
      type: 'identify',
      userId: requiredString(payload.userId, 'User ID'),
      messageId: requiredString(payload.messageId, 'Message ID'),
      timestamp: payload.timestamp,
      traits: {
        ...buildAttributes(payload.traits, payload, audienceMembership, 'email'),
        email: requiredString(payload.email, 'Email')
      },
      ...(anonymousId ? { anonymousId } : {})
    })
  }
}

export default action
