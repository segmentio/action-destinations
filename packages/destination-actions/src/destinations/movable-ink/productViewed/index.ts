import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  movable_ink_url,
  user_id,
  anonymous_id,
  timestamp,
  timezone,
  product,
  categories_required_false,
  meta
} from '../fields'
import omit from 'lodash/omit'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Product Viewed',
  description: 'Send a "Product Viewed" event to Movable Ink',
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  fields: {
    movable_ink_url,
    user_id,
    anonymous_id,
    timestamp,
    timezone,
    product,
    categories_required_false,
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
        event_name: 'Product Viewed',
        user_id: payload.user_id,
        anonymous_id: payload.anonymous_id,
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        product: payload.product,
        categories: payload.categories_required_false,
        metadata: { ...omit(payload.meta, ['product', 'categories']) }
      }
    })
  }
}

export default action
