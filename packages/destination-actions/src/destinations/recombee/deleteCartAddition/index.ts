import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Batch, DeleteCartAddition, RecombeeApiClient } from '../recombeeApiClient'
import { userIdField, itemIdField, deleteTimestampField } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Cart Addition',
  description: 'Deletes a cart addition of the given item made by the given user.',
  defaultSubscription: 'type = "track" and event = "Product Removed"',
  fields: {
    userId: userIdField('The ID of the user who added the item to the cart.'),
    itemId: itemIdField('The ID of the item that was added to the cart.'),
    timestamp: deleteTimestampField('cart addition')
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
