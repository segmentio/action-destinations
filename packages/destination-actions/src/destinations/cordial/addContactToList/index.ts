import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import { userIdentities } from '../user-identities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Contact to List',
  description: 'Add Contact to Cordial List',
  defaultSubscription: 'type = "group"',
  fields: {
    ...userIdentities,
    groupId: {
      label: 'Group ID',
      description: 'Segment Group ID',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    listName: {
      label: 'List Name',
      description: 'Cordial List Name',
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
