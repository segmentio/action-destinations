import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, anonymous_id, timestamp, timezone, products, order_id, revenue } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion',
  description: "Send an event containing conversion details to Movable Ink",
  fields: {
    user_id, 
    anonymous_id, 
    timestamp,
    timezone,
    products,
    order_id,
    revenue
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
        id: payload.order_id,
        revenue: payload.revenue
      }
    })
  }
}

export default action
