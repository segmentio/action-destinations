import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_id,
  anonymous_id,
  timestamp,
  event_name,
  group_id,
  properties,
  engage_space,
  message_id,
  consent,
  validateConsentObject
} from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Track',
  description: 'Send a track call to Segment’s tracking API. This is used to record actions your users perform.',
  fields: {
    engage_space,
    user_id,
    anonymous_id,
    timestamp,
    event_name,
    group_id,
    properties,
    message_id,
    consent
  },
  perform: (_, { payload, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const isValidConsentObject = validateConsentObject(payload?.consent)

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, `action:sendTrack`])

    return {
      batch: [
        {
          userId: payload?.user_id,
          anonymousId: payload?.anonymous_id,
          timestamp: payload?.timestamp,
          event: payload?.event_name,
          messageId: payload?.message_id,
          integrations: {
            // Setting 'integrations.All' to false will ensure that we don't send events
            // to any destinations which is connected to the Segment Profiles space.
            All: false
          },
          properties: {
            ...payload?.properties
          },
          context: {
            consent: isValidConsentObject ? { ...payload?.consent } : {}
          },
          type: 'track'
        }
      ]
    }
  }
}

export default action
