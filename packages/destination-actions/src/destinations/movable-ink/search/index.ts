import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, anonymous_id, timestamp, timezone, query, search_url } from '../fields'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: "Send details of a search event",
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: {
    user_id, 
    anonymous_id, 
    timestamp,
    timezone,
    query,
    search_url
  },
  perform: (request, { settings, payload }) => { 
    return request(`${settings.movableInkURL}/events`, {
      method: 'POST',
      json: {
        event_name: 'Search',
        user_id: payload.user_id, 
        anonymous_id: payload.anonymous_id, 
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        query: payload.query,
        url: payload.search_url
      }
    })
  }
}

export default action

