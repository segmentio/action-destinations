import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_identifiers, event_type, products, order_id, total, timestamp } from '../fields'
import { RequestClient } from '@segment/actions-core'
import { hosts } from '../utils'

const sendRequest = async (request: RequestClient, payloads: Payload[], settings: Settings) => {
  const host = hosts[settings.region]

  const requestBody = payloads.map((payload) => {
    return {
      user_identifiers: payload.user_identifiers,
      action: payload.event_action,
      type: payload.event_type ?? 'custom',
      timestamp: payload.timestamp,
      order_id: payload.order_id,
      total: payload.total,
      products: payload.products
    }
  })

  return request(`${host}/batch_custom_event`, {
    method: 'post',
    json: requestBody
  })
}

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
    timestamp: { ...timestamp },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of event data to Optimizely.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Number of events to batch before sending to Optimizely.',
      type: 'integer',
      default: 100,
      unsafe_hidden: true
    }
  },
  perform: (request, { payload, settings }) => {
    return sendRequest(request, [payload], settings)
  },
  performBatch: (request, { payload, settings }) => {
    return sendRequest(request, payload, settings)
  }
}

export default action
