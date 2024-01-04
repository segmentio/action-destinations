import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, email, enable_batching, batch_size, event_name } from '../properties'
import { removeFromList } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove From List',
  description: 'Remove users from a list in Marketo.',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    external_id: { ...external_id },
    email: { ...email },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size },
    event_name: { ...event_name }
  },
  perform: async (request, { settings, payload }) => {
    return removeFromList(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return removeFromList(request, settings, payload)
  }
}

export default action
