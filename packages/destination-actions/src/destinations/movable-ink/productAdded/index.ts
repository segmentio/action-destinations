import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, anonymous_id, timestamp, timezone, event_name, product_with_quantity, categories_required_false, meta } from '../fields'
import omit from 'lodash/omit'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Product Added',
  description: 'Send a "Cart Add" event to Movable Ink',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    event_name,
    user_id, 
    anonymous_id, 
    timestamp,
    timezone,
    product_with_quantity,
    categories_required_false,
    meta
  },
  perform: (request, { settings, payload }) => { 
    return request(`${settings.movableInkURL}/events`, {
      method: 'POST',
      json: {
        event_name: 'Cart Add',
        user_id: payload.user_id, 
        anonymous_id: payload.anonymous_id, 
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        product: payload.product_with_quantity,
        categories: payload.categories_required_false,
        metadata:  { ...omit(payload.meta, ['product_with_quantity', 'categories_required_false'])},
      }
    })
  }
}

export default action
