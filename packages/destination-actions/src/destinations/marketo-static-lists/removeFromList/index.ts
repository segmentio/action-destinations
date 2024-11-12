import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, lookup_field, field_value, enable_batching, batch_size, event_name } from '../properties'
import { removeFromList } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove From List',
  description: 'Remove users from a list in Marketo.',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    external_id: { ...external_id },
    lookup_field: { ...lookup_field },
    field_value: { ...field_value },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size, default: 300, maximum: 300 },
    event_name: { ...event_name }
  },
  perform: async (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('removeFromAudience', 1, statsContext?.tags)
    return removeFromList(request, settings, [payload], statsContext)
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('removeFromAudience.batch', 1, statsContext?.tags)
    return removeFromList(request, settings, payload, statsContext)
  }
}

export default action
