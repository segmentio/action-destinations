import { ActionDefinition, DynamicFieldResponse, RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DotdigitalContactApi, DotdigitalListsApi, DotdigitalDataFieldsApi } from '../api'
import { contactIdentifier } from '../input-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Contact to List',
  description: 'Adds a contact to a list.',
  defaultSubscription: 'type = "track" and event = "Add Contact to List"',
  fields: {
    ...contactIdentifier,
    listId: {
      label: 'List',
      description: `The list to add the contact to.`,
      type: 'number',
      required: true,
      dynamic: true
    },
    dataFields: {
      label: 'Data Fields',
      description: `An object containing key/value pairs for any data fields assigned to this contact, custom data fields needs to exists in Dotdigital.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only',
      additionalProperties: false,
      dynamic: true
    }
  },
  dynamicFields: {
    listId: async (request: RequestClient, { settings }): Promise<DynamicFieldResponse> => {
      return new DotdigitalListsApi(settings, request).getLists()
    },
    dataFields: {
      __keys__: async (request, { settings }) => {
        return new DotdigitalDataFieldsApi(settings, request).getDataFields()
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    const contactApi = new DotdigitalContactApi(settings, request)
    const dataFieldsApi = new DotdigitalDataFieldsApi(settings, request)
    const { channelIdentifier, emailIdentifier, mobileNumberIdentifier } = payload
    const identifierValue = channelIdentifier === 'email' ? emailIdentifier : mobileNumberIdentifier

    if (!identifierValue) {
      throw new PayloadValidationError(
        channelIdentifier === 'email' ? 'Email address is required' : 'Mobile number is required'
      )
    }

    await dataFieldsApi.validateDataFields(payload)
    return contactApi.upsertContact(payload)
  }
}

export default action
