import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AddBookmark, Batch, RecombeeApiClient } from '../recombeeApiClient'
import { interactionFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Bookmark',
  description: 'Adds a bookmark of the given item made by the given user.',
  defaultSubscription: 'type = "track" and event = "Product Added to Wishlist"',
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
      description: 'The bookmarked item.',
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
      description: 'The UTC timestamp of when the bookmark event occurred.',
      type: 'string',
      required: false,
      default: { '@path': '$.timestamp' }
    },
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
