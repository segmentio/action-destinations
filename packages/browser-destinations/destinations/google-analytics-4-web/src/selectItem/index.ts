import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import {
  user_properties,
  params,
  user_id,
  items_single_products,
  item_list_name,
  item_list_id,
  send_to
} from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Select Item',
  description: 'This event signifies an item was selected from a list.',
  defaultSubscription: 'type = "track" and event = "Product Clicked"',
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
    params: params,
    send_to: send_to
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'select_item', {
      item_list_id: payload.item_list_id,
      item_list_name: payload.item_list_name,
      items: payload.items,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      send_to: payload.send_to == true ? settings.measurementID : 'default',
      ...payload.params
    })
  }
}

export default action
