import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import {
  user_properties,
  params,
  user_id,
  items_single_products,
  item_list_name,
  item_list_id
} from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Select Item',
  description: 'This event signifies an item was selected from a list.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    user_id: user_id,
    item_list_name: item_list_name,
    item_list_id: item_list_id,
    items: {
      ...items_single_products,
      required: true
    },
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, event) => {
    const payload = event.payload
    if (payload.user_id) {
      gtag('set', { user_id: payload.user_id })
    }
    if (payload.user_properties) {
      gtag('set', { user_properties: payload.user_properties })
    }

    gtag('event', 'select_item', {
      item_list_id: payload.item_list_id,
      item_list_name: payload.item_list_name,
      items: payload.items,
      ...payload.params
    })
  }
}

export default action
