import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import { getUserIdentifier } from '../user-identifier'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Assign Contact to List',
  description: 'Assign Contact to Cordial List',
  defaultSubscription: 'type = "group"',
  fields: {
    ...commonFields,
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
        '@if': {
          exists: { '@path': '$.traits.name' },
          then: { '@path': '$.traits.name' },
          else: { '@path': '$.groupId' }
        }
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    const list = await client.upsertList(payload.groupId, payload.listName)
    const userIdentifier = getUserIdentifier(payload.identifyByKey, payload.identifyByValue)
    return client.addContactToList(userIdentifier, list)
  }
}

export default action
