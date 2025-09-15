import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AddDetailView, Batch, RecombeeApiClient } from '../recombeeApiClient'
import { interactionFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Detail View',
  description: 'Adds a detail view of the given item made by the given user.',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The ID of the user who viewed the item.',
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
      description: 'The viewed item.',
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
      description: 'The UTC timestamp of when the view occurred.',
      type: 'string',
      required: false,
      default: { '@path': '$.timestamp' }
    },
    duration: {
      label: 'Duration',
      description: 'The duration of the view in seconds.',
      type: 'integer',
      required: false
    },
    ...interactionFields('view')
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new AddDetailView(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map((payload) => new AddDetailView(payload))))
  }
}

export default action
