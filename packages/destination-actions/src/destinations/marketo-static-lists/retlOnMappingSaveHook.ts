import type { IntegrationError } from '@segment/actions-core'
import type { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import type { Settings } from './generated-types'
import { createList, getList } from './functions'

export function retlOnMappingSaveHook<Payload>(): ActionHookDefinition<Settings, Payload, any, any, any> {
  return {
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
}
