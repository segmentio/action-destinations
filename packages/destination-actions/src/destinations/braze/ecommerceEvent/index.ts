import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { 
  name,
  external_id,
  user_alias,
  _update_existing_only,
  email,
  phone,
  braze_id,
  cancel_reason,
  time,
  checkout_id,
  order_id,
  cart_id,
  total_value,
  total_discounts,
  discounts,
  currency,
  source,
  product,
  products,
  metadata,
  type,
  enable_batching,
  batch_size
} from './fields'
import { send } from './functions'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Ecommerce Event',
  description: 'Send an ecommerce event to Braze',
  fields: {
    name,
    external_id,
    user_alias,
    _update_existing_only,
    email,
    phone,
    braze_id,
    cancel_reason,
    time,
    checkout_id,
    order_id,
    cart_id,
    total_value,
    total_discounts,
    discounts,
    currency,
    source,
    product,
    products,
    metadata,
    type,
    enable_batching,
    batch_size
  },
  perform: async (request, {payload, settings}) => {
    console.log("Performing Braze Ecommerce Event Action with payload")
    return await send(request, [payload], settings, false)
  },
  performBatch: async (request, {payload, settings}) => {
    return await send(request, payload, settings, true)
  }
}

export default action
