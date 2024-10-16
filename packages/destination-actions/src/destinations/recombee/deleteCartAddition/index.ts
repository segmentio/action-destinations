import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Batch, DeleteCartAddition, RecombeeApiClient } from '../recombeeApiClient'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Cart Addition',
  description: 'Deletes a cart addition of the given item made by the given user.',
  defaultSubscription: 'type = "track" and event = "Product Removed"',
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
    itemId: {
      label: 'Item ID',
      description: 'The item that was added to the cart.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.product_id' },
          then: { '@path': '$.properties.product_id' },
          else: { '@path': '$.properties.asset_id' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'The UTC timestamp of when the cart addition occurred. If the timestamp is omitted, then all the cart additions with the given `userId` and `itemId` are deleted.',
      type: 'string',
      required: false
    }
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new DeleteCartAddition(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map((payload) => new DeleteCartAddition(payload))))
  }
}

export default action
