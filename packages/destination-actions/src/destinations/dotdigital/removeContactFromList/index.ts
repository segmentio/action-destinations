import { ActionDefinition, DynamicFieldResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DDContactApi, DDListsApi } from '../api'
import { contactIdentifier } from '../input-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Contact from List',
  description: 'Removes a Contact from a List.',
  defaultSubscription: 'type = "track" and event = "Remove Contact from List"',
  fields: {
    ...contactIdentifier,
    listId: {
      label: 'List',
      description: `The List to remove the Contact from.`,
      type: 'number',
      required: true,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      dynamic: true
    }
  },

  dynamicFields: {
    listId: async (request: RequestClient, { settings }): Promise<DynamicFieldResponse> => {
      return new DDListsApi(settings, request).getLists()
    }
  },

  perform: async (request, { settings, payload }) => {
    const { channelIdentifier, emailIdentifier, mobileNumberIdentifier, listId } = payload
    const identifierValue = channelIdentifier === 'email' ? emailIdentifier : mobileNumberIdentifier

    const contact = new DDContactApi(settings, request)
    const response = await contact.getContact(channelIdentifier, identifierValue)

    const lists = new DDListsApi(settings, request)
    return lists.deleteContactFromList(listId, response.contactId)
  }
}

export default action
