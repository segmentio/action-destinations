import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Batch, MergeUsers, RecombeeApiClient } from '../recombeeApiClient'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Merge Users',
  description:
    'Merges interactions (purchases, ratings, bookmarks, detail views, ...) of two different users under a single user ID.',
  defaultSubscription: 'type = "alias"',
  fields: {
    targetUserId: {
      label: 'Target User ID',
      description: 'The ID of the target user that will be **kept** after the merge.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    sourceUserId: {
      label: 'Source User ID',
      description: 'The ID of the source user that will be **deleted** after the merge.',
      type: 'string',
      required: true,
      default: { '@path': '$.previousId' }
    }
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new MergeUsers(data.payload.targetUserId, data.payload.sourceUserId))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(
      new Batch(data.payload.map((payload) => new MergeUsers(payload.targetUserId, payload.sourceUserId)))
    )
  }
}

export default action
