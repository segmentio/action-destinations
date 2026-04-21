import type { IntegrationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { external_id, lookup_field, data, enable_batching, batch_size, event_name } from '../properties'
import { addToList, addToListBatch, createList, getList } from '../functions'

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
    retlOnMappingSave: {
      label: 'Connect to a static list in Marketo',
      description: 'When saving this mapping, we will create a static list in Marketo using the fields you provided.',
      inputFields: {
        list_id: {
          type: 'string',
          label: 'Existing List ID',
          description:
            'The ID of the Marketo Static List that users will be synced to. If defined, we will not create a new list.',
          required: false
        },
        list_name: {
          type: 'string',
          label: 'List Name',
          description: 'The name of the Marketo Static List that you would like to create.',
          required: false
        }
      },
      outputTypes: {
        id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the created Marketo Static List that users will be synced to.',
          required: false
        },
        name: {
          type: 'string',
          label: 'List Name',
          description: 'The name of the created Marketo Static List that users will be synced to.',
          required: false
        }
      },
      performHook: async (request, { settings, hookInputs, statsContext }) => {
        if (hookInputs.list_id) {
          try {
            return getList(request, settings, hookInputs.list_id)
          } catch (e) {
            const message = (e as IntegrationError).message || JSON.stringify(e) || 'Failed to get list'
            const code = (e as IntegrationError).code || 'GET_LIST_FAILURE'
            return {
              error: {
                message,
                code
              }
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
            successMessage: `List '${hookInputs.list_name}' (id: ${listId}) created successfully!`,
            savedData: {
              id: listId,
              name: hookInputs.list_name
            }
          }
        } catch (e) {
          const message = (e as IntegrationError).message || JSON.stringify(e) || 'Failed to create list'
          const code = (e as IntegrationError).code || 'CREATE_LIST_FAILURE'
          return {
            error: {
              message,
              code
            }
          }
        }
      }
    }
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
