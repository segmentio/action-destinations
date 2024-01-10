import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, currency, user_id, value, items_single_products } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'View Item',
  description:
    'This event signifies that some content was shown to the user. Use this event to discover the most popular items viewed.',
  defaultSubscription: 'type = "track" and event =  "Product Viewed"',
  platform: 'web',
  fields: {
    user_id: user_id,
    currency: currency,
    value: value,
    items: {
      ...items_single_products,
      required: true
    },
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'view_item', {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
      send_to: settings.measurementID,
      user_id: payload.user_id ?? undefined,
      ...payload.user_properties,
      ...payload.params
    })
  }
}

export default action
