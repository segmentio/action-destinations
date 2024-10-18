import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AddPurchase, Batch, RecombeeApiClient } from '../recombeeApiClient'
import { interactionFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Purchase',
  description: 'Adds a purchase of the given item(s) made by the given user.',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The ID of the user who purchased the item(s).',
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
      description: 'The items that were purchased.',
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
          description: 'The amount (number) of the item purchased.',
          type: 'number',
          required: false,
          default: 1
        },
        price: {
          label: 'Price (per item)',
          description:
            'The price of the purchased item. If `amount` is greater than 1, the price of one item should be given.',
          type: 'number',
          required: false
        },
        profit: {
          label: 'Profit (per item)',
          description:
            'The profit of the purchased item. If `amount` is greater than 1, the profit per one item should be given.',
          type: 'number',
          required: false
        }
      },
      default: {
        // Order Completed is an event with an array of products
        '@arrayPath': [
          '$.properties.products',
          {
            itemId: {
              '@if': {
                exists: { '@path': '$.product_id' },
                then: { '@path': '$.product_id' },
                else: { '@path': '$.sku' }
              }
            },
            amount: {
              '@path': '$.quantity'
            },
            price: {
              '@path': '$.price'
            },
            profit: {
              '@path': '$.profit'
            }
          }
        ]
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The UTC timestamp of when the purchase occurred.',
      type: 'string',
      required: false,
      default: { '@path': '$.timestamp' }
    },
    ...interactionFields('purchase')
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

function payloadToInteractions(payload: Payload): AddPurchase[] {
  return payload.items.map(
    (item) =>
      new AddPurchase({
        userId: payload.userId,
        ...item,
        timestamp: payload.timestamp,
        recommId: payload.recommId,
        additionalData: payload.additionalData
      })
  )
}

export default action
