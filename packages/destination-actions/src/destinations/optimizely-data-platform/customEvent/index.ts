import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_identifiers, event_type, products, order_id, total, timestamp } from '../fields'
import { hosts } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ecommerce Event',
  description: 'Send Segment Ecommerce track() events to Optimizely Data Platform',
  fields: {
    user_identifiers: user_identifiers,
    event_type: { ...event_type },
    event_action: {
      label: 'Optimizely Event Action',
      description: 'The name of the Optimizely Event Action.',
      type: 'string',
      required: true
    },
    products: { ...products },
    order_id: { ...order_id },
    total: { ...total },
    timestamp: { ...timestamp }
  },
  perform: (request, { payload, settings }) => {
    const host = hosts[settings.region]

    const body = {
      user_identifiers: payload.user_identifiers,
      action: payload.event_action,
      type: payload.event_type ?? 'custom',
      timestamp: payload.timestamp,
      order_id: payload.order_id,
      total: payload.total,
      products: payload.products
    }

    return request(`${host}/custom_event`, {
      method: 'post',
      json: body
    })
  }
}

export default action
