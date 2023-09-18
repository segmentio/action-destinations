import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_identifiers,
  event_action,
  products,
  order_id,
  total,
  timestamp
} from '../fields'
import { hosts } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Multi Product Event',
  description: 'Send Segment analytics / track() events to Optimizely Data Platform',
  fields: {
    user_identifiers: user_identifiers,
    event_action: {...event_action},
    products: {...products},
    order_id: {...order_id},
    total: {...total},
    timestamp: {...timestamp}
  },
  perform: (request, { payload, settings }) => {
    const host = hosts[settings.region]

    const body = {
      type: 'product',
      requestType: 'multi',
      user_identifiers: payload.user_identifiers,
      action: payload.event_action,
      timestamp: payload.timestamp,
      order_id: payload.order_id,
      total: payload.total,
      purchase: payload.products
    }
    
    return request(`${host}/product_event`, {
      method: 'post',
      json: body
    });
  }
}

export default action
