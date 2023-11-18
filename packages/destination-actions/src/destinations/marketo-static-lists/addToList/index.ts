import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, email, enable_batching, batch_size, event_name } from '../properties'
import { addToList } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to List',
  description: 'Add users from an Engage Audience to a list in Marketo.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    external_id: { ...external_id },
    email: { ...email },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size },
    event_name: { ...event_name }
  },
  perform: async (request, { settings, payload }) => {
    return addToList(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return addToList(request, settings, payload)
  }
}

export default action
