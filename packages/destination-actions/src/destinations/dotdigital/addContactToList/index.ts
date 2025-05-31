import { ActionDefinition, DynamicFieldResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DDContactApi, DDListsApi, DDDataFieldsApi } from '../api'
import { contactIdentifier } from '../input-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Contact to List',
  description: 'Adds a Contact to a list.',
  defaultSubscription: 'type = "track" and event = "Add Contact to List"',
  fields: {
    ...contactIdentifier,
    listId: {
      label: 'List',
      description: `The list to add the contact to.`,
      type: 'number',
      required: true,
      allowNull: false,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      dynamic: true
    },
    dataFields: {
      label: 'Data Fields',
      description: `An object containing key/value pairs for data fields assigned to this Contact. Custom Data Fields must already be defined in Dotdigital.`,
      type: 'object',
      required: false,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      defaultObjectUI: 'keyvalue:only',
      additionalProperties: false,
      dynamic: true
    }
  },
  dynamicFields: {
    listId: async (request: RequestClient, { settings }): Promise<DynamicFieldResponse> => {
      return new DDListsApi(settings, request).getLists()
    },
    dataFields: {
      __keys__: async (request, { settings }) => {
        return new DDDataFieldsApi(settings, request).getDataFields()
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    const fieldsAPI = new DDDataFieldsApi(settings, request)
    await fieldsAPI.validateDataFields(payload)

    const contactApi = new DDContactApi(settings, request)
    return contactApi.upsertContact(payload)
  }
}

export default action
