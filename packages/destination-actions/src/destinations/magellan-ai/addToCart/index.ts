import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'
import { productFields } from '../schema'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart',
  description: 'This event tracks any time an object is added to the cart.',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    quantity: {
      label: 'Quantity',
      description: 'The number of items added to the cart',
      type: 'number',
      default: { '@path': '$.properties.quantity' },
      required: true
    },
    ...productFields
  },
  perform: buildPerformer('add_to_cart')
}

export default action
