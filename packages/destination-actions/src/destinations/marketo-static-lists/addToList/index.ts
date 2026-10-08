import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, lookup_field, data, enable_batching, batch_size, event_name } from '../properties'
import { addToList, addToListBatch } from '../functions'
import { retlOnMappingSaveHook } from '../retlOnMappingSaveHook'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to List',
  description: 'Add users to a list in Marketo.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    external_id: { ...external_id },
    lookup_field: { ...lookup_field },
    data: { ...data },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size },
    event_name: { ...event_name }
  },
  hooks: {
    retlOnMappingSave: retlOnMappingSaveHook<Payload>()
  },
  perform: async (request, { settings, payload, statsContext, hookOutputs }) => {
    statsContext?.statsClient?.incr('addToAudience', 1, statsContext?.tags)
    return addToList(request, settings, payload, statsContext, hookOutputs?.retlOnMappingSave?.outputs)
  },
  performBatch: async (request, { settings, payload, statsContext, hookOutputs }) => {
    statsContext?.statsClient?.incr('addToAudience.batch', 1, statsContext?.tags)
    return addToListBatch(request, settings, payload, statsContext, hookOutputs?.retlOnMappingSave?.outputs)
  }
}

export default action
