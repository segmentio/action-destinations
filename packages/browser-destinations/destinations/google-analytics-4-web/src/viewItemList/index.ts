import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, items_multi_products, item_list_name, item_list_id } from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'View Item List',
  description: 'Log this event when the user has been presented with a list of items of a certain category.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Product List Viewed"',
  fields: {
    user_id: user_id,
    item_list_id: item_list_id,
    item_list_name: item_list_name,
    items: {
      ...items_multi_products,
      required: true
    },
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'view_item_list', {
      item_list_id: payload.item_list_id,
      item_list_name: payload.item_list_name,
      items: payload.items,
      send_to: settings.measurementID,
      user_id: payload.user_id ?? null,
      ...payload.user_properties,
      ...payload.params
    })
  }
}

export default action
