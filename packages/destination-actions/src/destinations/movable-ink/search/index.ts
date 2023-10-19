import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { movable_ink_url, user_id, anonymous_id, timestamp, timezone, query, query_url, meta } from '../fields'
import omit from 'lodash/omit'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send a "Search" event to Movable Ink',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: {
    movable_ink_url,
    user_id,
    anonymous_id,
    timestamp,
    timezone,
    query,
    query_url,
    meta
  },
  perform: (request, { settings, payload }) => {
    const url = payload?.movable_ink_url ?? settings?.movable_ink_url
    if (!url)
      throw new IntegrationError(
        '"Movable Ink URL" setting or "Movable Ink URL" field must be populated',
        'MISSING_DESTINATION_URL',
        400
      )

    return request(url, {
      method: 'POST',
      json: {
        event_name: 'Search',
        user_id: payload.user_id,
        anonymous_id: payload.anonymous_id,
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        query: payload.query,
        url: payload.query_url,
        metadata: { ...omit(payload.meta, ['query', 'url']) }
      }
    })
  }
}

export default action
