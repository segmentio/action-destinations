import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { event_name, user_id, anonymous_id, timestamp, timezone, products, order_id, revenue, meta } from '../fields'
import omit from 'lodash/omit'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion',
  description: "Send a Conversion event Movable Ink",
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    event_name,
    user_id, 
    anonymous_id, 
    timestamp,
    timezone,
    products,
    order_id,
    revenue,
    meta
  },
  perform: (request, { settings, payload }) => { 
    return request(`${settings.movableInkURL}/events`, {
      method: 'POST',
      json: {
        event_name: "Conversion",
        user_id: payload.user_id, 
        anonymous_id: payload.anonymous_id, 
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        products: payload.products,
        order_id: payload.order_id,
        revenue: payload.revenue,
        metadata:  { ...omit(payload.meta, ['products', 'order_id', 'revenue'])},
      }
    })
  }
}

export default action
