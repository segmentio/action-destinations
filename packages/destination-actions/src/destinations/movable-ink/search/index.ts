import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { event_name, user_id, anonymous_id, timestamp, timezone, query, query_url, meta } from '../fields'
import omit from 'lodash/omit'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send a "Search" event to Movable Ink',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: {
    event_name,
    user_id, 
    anonymous_id, 
    timestamp,
    timezone,
    query,
    query_url,
    meta
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
        url: payload.query_url,
        metadata:  { ...omit(payload.meta, ['query', 'query_url'])}
      }
    })
  }
}

export default action

