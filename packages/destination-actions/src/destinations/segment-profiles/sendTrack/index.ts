import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, anonymous_id, timestamp, event_name, group_id, properties } from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Track',
  description: '',
  fields: {
    user_id,
    anonymous_id,
    timestamp,
    event_name,
    group_id,
    properties
  },
  perform: (_, { payload }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    return {
      batch: [
        {
          userId: payload?.user_id,
          anonymousId: payload?.anonymous_id,
          timestamp: payload?.timestamp,
          event: payload?.event_name,
          properties: {
            ...payload?.properties
          }
        }
      ]
    }
  }
}

export default action
