import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Batch, DeleteBookmark, RecombeeApiClient } from '../recombeeApiClient'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Bookmark',
  description: 'Deletes a bookmark of the given item made by the given user.',
  defaultSubscription: 'type = "track" and event = "Product Removed from Wishlist"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The ID of the user who bookmarked the item.',
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
      description: 'The item that was bookmarked.',
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
        'The UTC timestamp of when the bookmark occurred. If the timestamp is omitted, then all the bookmarks with the given `userId` and `itemId` are deleted.',
      type: 'string',
      required: false
    }
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
