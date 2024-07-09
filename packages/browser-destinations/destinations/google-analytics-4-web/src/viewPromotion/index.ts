import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  creative_name,
  creative_slot,
  promotion_id,
  promotion_name,
  user_id,
  minimal_items,
  items_single_products,
  params,
  user_properties,
  location_id,
  send_to
} from '../ga4-properties'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'View Promotion',
  description: 'This event signifies a promotion was viewed from a list.',
  defaultSubscription: 'type = "track" and event = "Promotion Viewed"',
  platform: 'web',
  fields: {
    user_id: user_id,
    creative_name: creative_name,
    creative_slot: { ...creative_slot, default: { '@path': '$.properties.creative' } },
    location_id: location_id,
    promotion_id: { ...promotion_id, default: { '@path': '$.properties.promotion_id' } },
    promotion_name: { ...promotion_name, default: { '@path': '$.properties.name' } },
    items: {
      ...items_single_products,
      required: true,
      properties: {
        ...minimal_items.properties,
        creative_name: {
          ...creative_name
        },
        creative_slot: {
          ...creative_slot
        },
        promotion_name: {
          ...promotion_name
        },
        promotion_id: {
          ...promotion_id
        }
      }
    },
    user_properties: user_properties,
    params: params,
    send_to: send_to
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'view_promotion', {
      creative_name: payload.creative_name,
      creative_slot: payload.creative_slot,
      location_id: payload.location_id,
      promotion_id: payload.promotion_id,
      promotion_name: payload.promotion_name,
      items: payload.items,
      user_id: payload.user_id ?? undefined,
      user_properties: payload.user_properties,
      send_to: payload.send_to == true ? settings.measurementID : 'default',
      ...payload.params
    })
  }
}

export default action
