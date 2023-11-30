import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, currency, user_id, value, items_single_products } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

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
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)

    gtag('event', 'view_item', {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
