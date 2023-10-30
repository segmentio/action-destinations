import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  movable_ink_url,
  user_id,
  anonymous_id,
  timestamp,
  timezone,
  products,
  order_id,
  revenue,
  meta
} from '../fields'
import omit from 'lodash/omit'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion',
  description: 'Send a Conversion event Movable Ink',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    movable_ink_url,
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
        event_name: 'Conversion',
        user_id: payload.user_id,
        anonymous_id: payload.anonymous_id,
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        products: payload.products,
        order_id: payload.order_id,
        revenue: payload.revenue,
        metadata: { ...omit(payload.meta, ['products', 'order_id', 'revenue']) }
      }
    })
  }
}

export default action
