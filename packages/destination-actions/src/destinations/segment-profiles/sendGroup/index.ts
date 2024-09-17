import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_id,
  anonymous_id,
  group_id,
  traits,
  engage_space,
  timestamp,
  message_id,
  consent,
  validateConsentObject
} from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Group',
  description: 'Send a group call to Segment’s tracking API. This is used to associate an individual user with a group',
  defaultSubscription: 'type = "group"',
  fields: {
    engage_space,
    user_id,
    anonymous_id,
    group_id: { ...group_id, required: true },
    traits,
    timestamp,
    message_id,
    consent
  },
  perform: (_request, { payload, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }
    const isValidConsentObject = validateConsentObject(payload?.consent)

    const groupPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      groupId: payload?.group_id,
      messageId: payload?.message_id,
      traits: {
        ...payload?.traits
      },
      timestamp: payload?.timestamp,
      integrations: {
        // Setting 'integrations.All' to false will ensure that we don't send events
        // to any destinations which is connected to the Segment Profiles space.
        All: false
      },
      type: 'group',
      context: {
        consent: isValidConsentObject ? { ...payload?.consent } : {}
      }
    }

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, `action:sendGroup`])
    return { batch: [groupPayload] }
  }
}

export default action
