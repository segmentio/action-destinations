import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Batch, DeleteBookmark, RecombeeApiClient } from '../recombeeApiClient'
import { userIdField, itemIdField, deleteTimestampField } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Bookmark',
  description: 'Deletes a bookmark of the given item made by the given user.',
  defaultSubscription: 'type = "track" and event = "Product Removed from Wishlist"',
  fields: {
    userId: userIdField({ description: 'The ID of the user who bookmarked the item.' }),
    itemId: itemIdField({ description: 'The ID of the item that was bookmarked.' }),
    timestamp: deleteTimestampField('bookmark')
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new DeleteBookmark(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map((payload) => new DeleteBookmark(payload))))
  }
}

export default action
