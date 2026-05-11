import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AddDetailView, Batch, RecombeeApiClient } from '../recombeeApiClient'
import { interactionFields, userIdField, itemIdField, interactionTimestampField } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Detail View',
  description: 'Adds a detail view of the given item made by the given user.',
  fields: {
    userId: userIdField({ description: 'The ID of the user who viewed the item.' }),
    itemId: itemIdField({ description: 'The ID of the item that was viewed.' }),
    timestamp: interactionTimestampField('view'),
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
