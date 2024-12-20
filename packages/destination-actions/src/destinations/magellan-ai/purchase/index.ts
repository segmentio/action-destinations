import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'
import { orderInfoFields, priceFields } from '../schema'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Fire this event upon successful completion of a purchase.',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    ...priceFields('total'),
    ...orderInfoFields,
    isNewCustomer: {
      label: 'New customer?',
      description: 'Whether or not this customer is a first-time buyer from your store',
      type: 'boolean',
      required: false
    }
  },
  perform: buildPerformer('purchase')
}

export default action
