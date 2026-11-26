import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  anonymousId,
  audienceDetails,
  email,
  engageAudienceKey,
  messageId,
  nestedValueHandling,
  syncMode,
  timestamp,
  traits,
  userId
} from '../fields'
import { buildIdentifyJSON, requiredString, send } from '../functions'

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
    email,
    nestedValueHandling,
    traits,
    audienceDetails,
    engageAudienceKey
  },
  perform: (request, { settings, payload, audienceMembership }) => {
    const { email, messageId } = payload

    const validEmail = requiredString(email, 'Email')
    const validMessageId = requiredString(messageId, 'Message ID')

    return send(request, settings, buildIdentifyJSON(payload, validEmail, validMessageId, audienceMembership))
  }
}

export default action
