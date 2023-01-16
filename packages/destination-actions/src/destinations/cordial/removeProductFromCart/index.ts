import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from "../cordial-client";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Product from Cart',
  description: 'Removes product from Cordial contact cart',
  defaultSubscription: 'type = "track" and event = "Product Removed"',
  fields: {
    userIdentities: {
      label: 'User Identities',
      description:
        'An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. At least one identifier should be valid otherwise the contact will not be identified and the request will be ignored.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    },
    productID: {
      label: 'Product ID',
      description: 'Internal identifier of a product',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.product_id'
      }
    },
    qty: {
      label: 'Quantity',
      description: 'Quantity of a product',
      type: 'integer',
      required: true,
      default: {
        '@path': '$.properties.quantity'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.removeProductFromCart(payload)
  }
}

export default action
