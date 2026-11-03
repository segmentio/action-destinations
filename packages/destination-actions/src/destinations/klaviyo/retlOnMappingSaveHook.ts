import type { IntegrationError, RequestClient } from '@segment/actions-core'
import type { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import type { Settings, AudienceSettings } from './generated-types'
import { createList, getList, getListIdDynamicData } from './functions'

export function retlOnMappingSaveHook<Payload>(): ActionHookDefinition<
  Settings,
  Payload,
  AudienceSettings,
  { list_identifier?: string; list_name?: string },
  { id?: string; name?: string }
> {
  return {
    label: 'Connect to a static list in Klaviyo',
    description: 'When saving this mapping, we will connect to a list in Klaviyo.',
    inputFields: {
      list_identifier: {
        type: 'string',
        label: 'Existing List ID',
        description:
          'The ID of the list in Klaviyo that users will be synced to. If defined, we will not create a new list.',
        required: false,
        dynamic: async (request: RequestClient) => {
          return getListIdDynamicData(request)
        }
      },
      list_name: {
        type: 'string',
        label: 'Name of list to create',
        description: 'The name of the list that you would like to create in Klaviyo.',
        required: false
      }
    },
    outputTypes: {
      id: {
        type: 'string',
        label: 'ID',
        description: 'The ID of the created Klaviyo list that users will be synced to.',
        required: false
      },
      name: {
        type: 'string',
        label: 'List Name',
        description: 'The name of the created Klaviyo list that users will be synced to.',
        required: false
      }
    },
    performHook: async (request, { settings, hookInputs = {} }) => {
      if (hookInputs.list_identifier) {
        try {
          return getList(request, settings, hookInputs.list_identifier)
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
        return createList(request, settings, hookInputs.list_name ?? '')
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
