import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, lookup_field, data, enable_batching, batch_size, event_name } from '../properties'
import { addToList, createList } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to List',
  description: 'Add users from an Engage Audience to a list in Marketo.',
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
    onMappingSave: {
      label: 'Create a new static list in Marketo',
      description: 'When saving this mapping, we will create a static list in Marketo using the fields you provided.',
      inputFields: {
        list_id: {
          type: 'string',
          label: 'List ID',
          description:
            'The ID of the Marketo static list that users will be synced to. If defined, we will not create a new list.',
          required: false
        },
        list_name: {
          type: 'string',
          label: 'List Name',
          description:
            'The Name of the Marketo static list that users will be synced to. If defined, we will not create a new list.',
          required: false
        }
      },
      outputTypes: {
        new_list_id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the created Marketo static list that users will be synced to.',
          required: true
        }
      },
      performHook: async (request, { settings, hookInputs, statsContext }) => {
        if (hookInputs.list_id) {
          // TODO add a verification method to verify this id is valid to use
          return {
            successMessage: `Using existing list ${hookInputs.list_id} created successfully!`,
            savedData: {
              id: hookInputs.list_id
            }
          }
        }

        try {
          const input = {
            audienceName: hookInputs.list_name,
            settings: settings
          }
          const listId = await createList(request, input, statsContext)

          return {
            successMessage: `List ${listId} created successfully!`,
            savedData: {
              id: listId
            }
          }
        } catch (e) {
          return {
            error: {
              message: 'Failed to create list',
              code: 'CREATE_LIST_FAILURE'
            }
          }
        }
      }
    }
  },
  perform: async (request, { settings, payload, statsContext, hookOutputs }) => {
    statsContext?.statsClient?.incr('addToAudience', 1, statsContext?.tags)
    // Use list_id from hook as external id for RETL mappings
    if (hookOutputs?.retlOnMappingSave?.outputs.new_list_id) {
      payload.external_id = hookOutputs?.retlOnMappingSave?.outputs.new_list_id
    }
    return addToList(request, settings, [payload], statsContext)
  },
  performBatch: async (request, { settings, payload, statsContext, hookOutputs }) => {
    statsContext?.statsClient?.incr('addToAudience.batch', 1, statsContext?.tags)
    // Use list_id from hook as external id for RETL mappings
    if (hookOutputs?.retlOnMappingSave?.outputs.new_list_id) {
      payload[0].external_id = hookOutputs?.retlOnMappingSave?.outputs.new_list_id
    }
    return addToList(request, settings, payload, statsContext)
  }
}

export default action
