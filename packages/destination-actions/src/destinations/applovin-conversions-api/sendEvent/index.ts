import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  batch_size,
  currency,
  dedupe_id,
  enable_batching,
  name,
  event_source_url,
  event_time,
  is_new_customer,
  items,
  payment_type,
  search_term,
  shipping,
  sign_up_method,
  tax,
  transaction_id,
  user_data,
  value
} from './fields'
import { send, sendBatch } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Send an event to the AppLovin Conversions API.',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    name,
    event_time,
    event_source_url,
    dedupe_id,
    user_data,
    items,
    currency,
    value,
    transaction_id,
    shipping,
    tax,
    is_new_customer,
    payment_type,
    search_term,
    sign_up_method,
    enable_batching,
    batch_size
  },
  perform: (request, { settings, payload }) => {
    return send(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return sendBatch(request, settings, payload)
  }
}

export default action
