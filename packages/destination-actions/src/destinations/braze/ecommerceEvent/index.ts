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
  checkout_url,
  products,
  metadata,
  enable_batching,
  batch_size
} from './fields'


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
    checkout_url,
    products,
    metadata,
    enable_batching,
    batch_size
  },
  perform: (request, data) => {
    
  }
}

export default action
