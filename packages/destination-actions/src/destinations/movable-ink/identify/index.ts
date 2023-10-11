import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, anonymous_id, timestamp, timezone } from '../fields'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Send an Identify event to Movable Ink, to assocate a userId with an anonymousId',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id, 
    anonymous_id, 
    timestamp,
    timezone
  },
  perform: (request, { settings, payload }) => { 
    return request(`${settings.movableInkURL}/identify`, {
      method: 'POST',
      json: {
        user_id: payload.user_id, 
        anonymous_id: payload.anonymous_id, 
        timestamp: payload.timestamp,
        timezone: payload.timezone
      }
    })
  }
}

export default action
