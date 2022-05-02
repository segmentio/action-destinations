import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Contact to List',
  description: 'Add contact to a list. If the list does not exist in Cordial it will be created.',
  defaultSubscription: 'type = "group"',
  fields: {
    userIdentities: {
      label: 'User Identities',
      description:
        'An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. At least one identifier should be valid otherwise the contact will not be identified and the request will be ignored.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    },
    groupId: {
      label: 'Group ID',
      description: 'Segment group id. Required.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    listName: {
      label: 'List name',
      description:
        'Cordial list name. Optional. If list name is empty, the name of the list will be set to segment_[groupId].',
      type: 'string',
      default: {
        '@path': '$.traits.name'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.addContactToList(payload)
  }
}

export default action
