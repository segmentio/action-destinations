import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, anonymous_id, timestamp, timezone, event_name, product, meta, categories } from '../fields'
import omit from 'lodash/omit'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Product Viewed',
  description: 'Send a "Product Viewed" event to Movable Ink',
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  fields: {
    event_name,
    user_id, 
    anonymous_id, 
    timestamp,
    timezone,
    product,
    meta,
    categories
  },
  perform: (request, { settings, payload }) => { 
    return request(`${settings.movableInkURL}/events`, {
      method: 'POST',
      json: {
        event_name: 'Product Viewed',
        user_id: payload.user_id, 
        anonymous_id: payload.anonymous_id, 
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        product: payload.product,
        categories: payload.categories,
        metadata:  { ...omit(payload.meta, ['product', 'categories'])},
      }
    })
  }
}

export default action
