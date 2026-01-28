import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../functions'
import { addToCartFields } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart',
  description: 'Send event when a user adds a product to the shopping cart',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: addToCartFields,
  perform: (request, { payload, settings, features, statsContext }) => {
    return send(request, payload, settings, features, statsContext)
  }
}

export default action
