import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AddBookmark, Batch, RecombeeApiClient } from '../recombeeApiClient'
import { interactionFields, userIdField, itemIdField, interactionTimestampField } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Bookmark',
  description: 'Adds a bookmark of the given item made by the given user.',
  defaultSubscription: 'type = "track" and event = "Product Added to Wishlist"',
  fields: {
    userId: userIdField({ description: 'The ID of the user who bookmarked the item.' }),
    itemId: itemIdField({ description: 'The ID of the item that was bookmarked.' }),
    timestamp: interactionTimestampField('bookmark'),
    ...interactionFields('bookmark')
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new AddBookmark(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map((payload) => new AddBookmark(payload))))
  }
}

export default action
