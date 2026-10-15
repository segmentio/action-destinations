import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { anonymousId, messageId, timestamp, userId, nestedValueHandling } from '../fields'
import { flattenValues, optionalString, requiredString, send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Send an identify event to Inflection to create or update a contact.',
  defaultSubscription: 'type = "identify"',
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
    }
  },
  perform: (request, { settings, payload }) => {
    const anonymousId = optionalString(payload.anonymousId)
    const traits = Object.fromEntries(
      Object.entries(
        flattenValues(payload.traits, {
          objects: payload.nestedValueHandling?.objectHandling,
          arrays: payload.nestedValueHandling?.arrayHandling
        }) ?? {}
      ).filter(([key]) => key.toLowerCase() !== 'email')
    )
    return send(request, settings, {
      type: 'identify',
      userId: requiredString(payload.userId, 'User ID'),
      messageId: requiredString(payload.messageId, 'Message ID'),
      timestamp: payload.timestamp,
      traits: {
        ...traits,
        email: requiredString(payload.email, 'Email')
      },
      ...(anonymousId ? { anonymousId } : {})
    })
  }
}

export default action
