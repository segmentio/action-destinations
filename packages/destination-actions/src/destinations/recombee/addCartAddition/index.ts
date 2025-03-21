import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AddCartAddition, Batch, RecombeeApiClient } from '../recombeeApiClient'
import { interactionFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Cart Addition',
  description: 'Adds a cart addition of the given item made by the given user.',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The ID of the user who added the item to the cart.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
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
    timestamp: {
      label: 'Timestamp',
      description: 'The UTC timestamp of when the cart addition occurred.',
      type: 'string',
      required: false,
      default: { '@path': '$.timestamp' }
    },
    ...interactionFields('cart addition')
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(payloadToInteraction(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map(payloadToInteraction)))
  }
}

function payloadToInteraction(payload: Payload): AddCartAddition {
  return new AddCartAddition({
    userId: payload.userId,
    ...payload.item,
    timestamp: payload.timestamp,
    recommId: payload.recommId,
    additionalData: payload.additionalData
  })
}

export default action
