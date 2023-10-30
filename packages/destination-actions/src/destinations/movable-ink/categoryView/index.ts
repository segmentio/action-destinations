import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  movable_ink_url,
  user_id,
  anonymous_id,
  timestamp,
  timezone,
  products_required_false,
  categories,
  meta
} from '../fields'
import omit from 'lodash/omit'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Category View',
  description: 'Send a "Category View" event to Movable Ink',
  defaultSubscription: 'type = "track" and event = "Category Viewed"',
  fields: {
    movable_ink_url,
    user_id,
    anonymous_id,
    timestamp,
    timezone,
    products_required_false,
    categories,
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
        event_name: 'Category View',
        user_id: payload.user_id,
        anonymous_id: payload.anonymous_id,
        timestamp: payload.timestamp,
        timezone: payload.timezone,
        product: payload.products_required_false,
        categories: payload.categories,
        metadata: { ...omit(payload.meta, ['products_required_false', 'categories']) }
      }
    })
  }
}

export default action
