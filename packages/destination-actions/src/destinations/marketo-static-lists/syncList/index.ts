import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, lookup_field, data, field_value, enable_batching, batch_size, event_name } from '../properties'
import { retlOnMappingSaveHook } from '../retlOnMappingSaveHook'
import { syncList, syncListBatch } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync List',
  description: 'Add or remove users from a list in Marketo',
  defaultSubscription: 'type = track or type = identify',
  syncMode: {
    label: 'Sync Mode',
    description: 'Specify how Segment should sync data to Marketo.',
    default: 'mirror',
    choices: [
      { label: 'Add - Segment will invoke this action when a new row is added to the table', value: 'add' },
      { label: 'Update - Segment will invoke this action when a row is updated in the table', value: 'update' },
      {
        label: 'Upsert - Segment will invoke this action when a row is added or updated in the table',
        value: 'upsert'
      },
      { label: 'Delete - Segment will invoke this action when a row is deleted from the table', value: 'delete' },
      {
        label: 'Mirror - Segment will invoke this action when a row is added, updated, or deleted from the table',
        value: 'mirror'
      }
    ]
  },
  fields: {
    external_id: { ...external_id },
    lookup_field: { ...lookup_field },
    data: { ...data },
    field_value: { ...field_value },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size, default: 300, maximum: 300 },
    event_name: { ...event_name }
  },
  hooks: {
    retlOnMappingSave: retlOnMappingSaveHook<Payload>()
  },
  perform: async (request, { settings, payload, statsContext, hookOutputs, audienceMembership }) => {
    statsContext?.statsClient?.incr('syncList', 1, statsContext?.tags)
    return syncList(
      request,
      settings,
      payload,
      audienceMembership,
      statsContext,
      hookOutputs?.retlOnMappingSave?.outputs
    )
  },
  performBatch: async (request, { settings, payload, statsContext, hookOutputs, audienceMembership }) => {
    statsContext?.statsClient?.incr('syncList.batch', 1, statsContext?.tags)
    return syncListBatch(
      request,
      settings,
      payload,
      audienceMembership ?? [],
      statsContext,
      hookOutputs?.retlOnMappingSave?.outputs
    )
  }
}

export default action
