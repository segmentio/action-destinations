import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, items_multi_products, item_list_name, item_list_id } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

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
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)

    gtag('event', 'view_item_list', {
      item_list_id: payload.item_list_id,
      item_list_name: payload.item_list_name,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
