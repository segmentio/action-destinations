import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AddCartAddition, Batch, RecombeeApiClient } from '../recombeeApiClient'
import { interactionFields, userIdField, interactionTimestampField } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Cart Addition',
  description: 'Adds a cart addition of the given item made by the given user.',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    userId: userIdField('The ID of the user who added the item to the cart.'),
    item: {
      label: 'Item',
      description: 'The item that was added to the cart.',
      type: 'object',
      required: true,
      properties: {
        itemId: {
          label: 'Item ID',
          description: 'ID of the item.',
          type: 'string',
          required: true
        },
        amount: {
          label: 'Amount',
          description: 'The amount (number) of the item added to the cart.',
          type: 'number',
          required: false,
          default: 1
        },
        price: {
          label: 'Price (per item)',
          description:
            'The price of the added item. If `amount` is greater than 1, the price of one item should be given.',
          type: 'number',
          required: false
        }
      },
      default: {
        itemId: {
          '@if': {
            exists: { '@path': '$.properties.product_id' },
            then: { '@path': '$.properties.product_id' },
            else: { '@path': '$.properties.sku' }
          }
        },
        amount: { '@path': '$.properties.quantity' },
        price: { '@path': '$.properties.price' }
      }
    },
    timestamp: interactionTimestampField('cart addition'),
    ...interactionFields('cart addition')
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(payloadToCartAddition(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map(payloadToCartAddition)))
  }
}

function payloadToCartAddition({ item: { amount, price, ...itemRest }, ...rest }: Payload): AddCartAddition {
  return new AddCartAddition({
    ...itemRest,
    amount,
    price: amount !== undefined && price !== undefined ? amount * price : price,
    ...rest
  })
}

export default action
