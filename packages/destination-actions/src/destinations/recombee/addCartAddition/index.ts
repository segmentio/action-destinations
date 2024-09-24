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
    items: {
      label: 'Items',
      description: 'The items that were added to the cart.',
      type: 'object',
      multiple: true,
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
        // Product Added is an event with a single product
        '@arrayPath': [
          '$.properties',
          {
            itemId: {
              '@if': {
                exists: { '@path': '$.product_id' },
                then: { '@path': '$.product_id' },
                else: { '@path': '$.asset_id' }
              }
            },
            amount: {
              '@path': '$.quantity'
            },
            price: {
              '@path': '$.price'
            }
          }
        ]
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
    await client.send(new Batch(payloadToInteractions(data.payload)))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.flatMap(payloadToInteractions)))
  }
}

function payloadToInteractions(payload: Payload): AddCartAddition[] {
  return payload.items.map(
    (item) =>
      new AddCartAddition({
        userId: payload.userId,
        ...item,
        timestamp: payload.timestamp,
        recommId: payload.recommId,
        additionalData: payload.additionalData
      })
  )
}

export default action
