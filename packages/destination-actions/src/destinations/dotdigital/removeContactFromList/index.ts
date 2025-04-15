import {
  ActionDefinition,
  DynamicFieldResponse,
  RequestClient
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DotdigitalContactApi, DotdigitalListsApi } from '../api'
import { contactIdentifier } from '../input-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Contact from List',
  description: '',
  defaultSubscription: 'type = "identify"',
  fields: {
    ...contactIdentifier,
    listId: {
      label: 'List',
      description: `The list to remove the contact from.`,
      type: 'number',
      required: true,
      dynamic: true
    }
  },

  dynamicFields: {
    listId: async (request: RequestClient, { settings }): Promise<DynamicFieldResponse> => {
      return new DotdigitalListsApi(settings, request).getLists()
    }
  },

  perform: async (request, { settings, payload }) => {
    const dotdigitalContact = new DotdigitalContactApi(settings, request)
    const dotdigitalLists = new DotdigitalListsApi(settings, request)
    const { channelIdentifier, emailIdentifier, mobileNumberIdentifier, listId } = payload
    const identifierValue = channelIdentifier === 'email' ? emailIdentifier : mobileNumberIdentifier
    const contactResponse = await dotdigitalContact.getContact(channelIdentifier, identifierValue)
    return dotdigitalLists.deleteContactFromList(listId, contactResponse.contactId)
  }
}

export default action
