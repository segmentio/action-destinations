import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from "../cordial-client";
import userIdentityFields from "../identities-fields";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Product from Cart',
  description: 'Removes product from Cordial contact cart',
  defaultSubscription: 'type = "track" and event = "Product Removed"',
  fields: {
    ...userIdentityFields,
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
