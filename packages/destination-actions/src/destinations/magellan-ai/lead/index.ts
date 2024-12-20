import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'
import { priceFields } from '../schema'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Lead',
  description: 'Track lead generation, like signups, subscriptions, and notification requests.',
  defaultSubscription: 'type = "track" and event = "Signed Up"',
  fields: {
    ...priceFields(),
    id: {
      label: 'Lead ID',
      description: 'The unique ID for this generated lead',
      type: 'string',
      required: false
    },
    productId: {
      label: 'Product ID',
      description: 'The product ID associated with this lead',
      type: 'string',
      default: { '@path': '$.properties.product_id' },
      required: false
    },
    quantity: {
      label: 'Quantity',
      description: 'The number of items represented by this lead',
      type: 'number',
      default: { '@path': '$.properties.quantity' },
      required: false
    },
    type: {
      label: 'Lead type',
      description: 'The type of lead',
      type: 'string',
      default: { '@path': '$.properties.type' },
      required: false
    },
    category: {
      label: 'Lead category',
      description: 'The category of lead',
      type: 'string',
      default: { '@path': '$.properties.category' },
      required: false
    }
  },
  perform: buildPerformer('lead')
}

export default action
