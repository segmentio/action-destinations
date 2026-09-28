import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, lookup_field, data, field_value, enable_batching, event_name } from '../properties'
import { ADD_BATCH_SIZE, REMOVE_BATCH_SIZE } from '../constants'
import { retlOnMappingSaveHook } from '../retlOnMappingSaveHook'
import { syncList, syncListBatch } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync List',
  description: 'Add or remove users from a list in Marketo',
  defaultSubscription: 'type = track or type = identify',
  syncMode: {
    label: 'Sync Mode',
    description: 'Specify how Segment should sync data to Marketo when connected to a database Source.',
    default: 'mirror',
    choices: [
      { label: 'Add - when connected to a database Source, adding a row will trigger this mapping', value: 'add' },
      { label: 'Update - when connected to a database Source, updating a row will trigger this mapping', value: 'update' },
      {
        label: 'Upsert - when connected to a database Source, adding or updating a row will trigger this mapping',
        value: 'upsert'
      },
      { label: 'Delete - when connected to a database Source, deleting a row will trigger this mapping', value: 'delete' },
      {
        label: 'Mirror - when connected to a database Source, adding, updating, or deleting a row will trigger this mapping',
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
    // Marketo caps list removals at 300 but accepts 300k on bulk import, so additions and
    // removals have to be batched separately and sized differently. `audience_membership`
    // below is the batch key; this field resolves per batch. The two directives are the same
    // tree with different leaves and must be kept in sync.
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: {
        '@if': {
          // Guard only. Without a computation_key the templates below render `$.properties.`,
          // which @path resolves to the entire properties object - non-blank, so everything
          // would read as an addition.
          exists: { '@path': '$.context.personas.computation_key' },
          then: {
            '@if': {
              // Does the payload carry a membership boolean at all? Engage and Journeys V2 do,
              // RETL and legacy Journeys V1 do not. `exists` is true for both true and false.
              exists: {
                '@if': {
                  // @template renders the audience key into a concrete path
                  // ($.traits.my_audience), @path then reads it. Engage identify carries the
                  // boolean in traits, track in properties, so try traits and fall back.
                  exists: { '@path': { '@template': '$.traits.{{context.personas.computation_key}}' } },
                  then: { '@path': { '@template': '$.traits.{{context.personas.computation_key}}' } },
                  else: { '@path': { '@template': '$.properties.{{context.personas.computation_key}}' } }
                }
              },
              then: {
                '@if': {
                  // Same lookup again - @if cannot bind an intermediate result. `blank` is the
                  // only condition that tells true from false, and only because `false == ''`
                  // in JS: true is not blank -> then, false counts as blank -> else.
                  blank: {
                    '@if': {
                      exists: { '@path': { '@template': '$.traits.{{context.personas.computation_key}}' } },
                      then: { '@path': { '@template': '$.traits.{{context.personas.computation_key}}' } },
                      else: { '@path': { '@template': '$.properties.{{context.personas.computation_key}}' } }
                    }
                  },
                  // Both leaves must be truthy - @if silently drops a falsy `else`.
                  then: ADD_BATCH_SIZE,
                  else: REMOVE_BATCH_SIZE
                }
              },
              // No boolean: RETL, or legacy Journeys V1 (always an addition). syncMode is only
              // readable from the mapping, not the event, so the event name is the only signal
              // left. @if has no equality operator, so `event == 'deleted'` is faked by
              // stripping that substring and testing whether anything remains.
              else: {
                '@if': {
                  blank: { '@replace': { value: { '@path': '$.event' }, pattern: 'deleted', replacement: '' } },
                  then: ADD_BATCH_SIZE,
                  else: REMOVE_BATCH_SIZE
                }
              }
            }
          },
          // No computation_key, so not an audience payload. Same event-name fallback.
          else: {
            '@if': {
              blank: { '@replace': { value: { '@path': '$.event' }, pattern: 'deleted', replacement: '' } },
              then: ADD_BATCH_SIZE,
              else: REMOVE_BATCH_SIZE
            }
          }
        }
      },
      minimum: 1,
      maximum: ADD_BATCH_SIZE,
      unsafe_hidden: true,
      required: true
    },
    // Identical to batch_size above, with 'add'/'remove' as the leaves. Mirrors
    // resolveAudienceMembership in actions-core, conservatively: it cannot classify a removal
    // as an addition, so a batch of removals can never exceed REMOVE_BATCH_SIZE. Core still
    // decides add vs remove at execute time; this only steers batching.
    audience_membership: {
      label: 'Audience Membership',
      description:
        'Whether the event adds the user to the list or removes them from it. Used to keep additions and removals in separate batches.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.personas.computation_key' },
          then: {
            '@if': {
              exists: {
                '@if': {
                  exists: { '@path': { '@template': '$.traits.{{context.personas.computation_key}}' } },
                  then: { '@path': { '@template': '$.traits.{{context.personas.computation_key}}' } },
                  else: { '@path': { '@template': '$.properties.{{context.personas.computation_key}}' } }
                }
              },
              then: {
                '@if': {
                  blank: {
                    '@if': {
                      exists: { '@path': { '@template': '$.traits.{{context.personas.computation_key}}' } },
                      then: { '@path': { '@template': '$.traits.{{context.personas.computation_key}}' } },
                      else: { '@path': { '@template': '$.properties.{{context.personas.computation_key}}' } }
                    }
                  },
                  then: 'add',
                  else: 'remove'
                }
              },
              else: {
                '@if': {
                  blank: { '@replace': { value: { '@path': '$.event' }, pattern: 'deleted', replacement: '' } },
                  then: 'add',
                  else: 'remove'
                }
              }
            }
          },
          else: {
            '@if': {
              blank: { '@replace': { value: { '@path': '$.event' }, pattern: 'deleted', replacement: '' } },
              then: 'add',
              else: 'remove'
            }
          }
        }
      },
      unsafe_hidden: true,
      required: false
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      multiple: true,
      default: ['audience_membership'],
      unsafe_hidden: true,
      required: false
    },
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
