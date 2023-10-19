import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  movable_ink_url,
  event_name,
  user_id,
  anonymous_id,
  timestamp,
  timezone,
  products_required_false,
  order_id_required_false,
  revenue_required_false,
  categories_required_false,
  meta
} from '../fields'
import omit from 'lodash/omit'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Event',
  description: 'Send a Custom Segment event to Movable Ink',
  defaultSubscription: 'type = "track"',
  fields: {
    movable_ink_url,
    event_name,
    user_id,
    anonymous_id,
    timestamp,
    timezone,
    products_required_false,
    categories_required_false,
    order_id_required_false,
    revenue_required_false,
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
        event_name: payload.event_name,
        user_id: payload.user_id,
        anonymous_id: payload.anonymous_id,
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        products: payload.products_required_false,
        categories: payload.categories_required_false,
        order_id: payload.order_id_required_false,
        revenue: payload.revenue_required_false,
        metadata: { ...omit(payload.meta, ['products', 'categories', 'order_id', 'revenue']) }
      }
    })
  }
}

export default action
