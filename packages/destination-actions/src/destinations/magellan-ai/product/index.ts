import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'
import { productFields } from '../schema'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Product',
  description:
    'Indicates that a user has visited the page for a specific product or variant of a product. This event is similar to the view event, but allows you to provide more details about the product the user has seen.',
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  fields: productFields,
  perform: buildPerformer('product')
}

export default action
