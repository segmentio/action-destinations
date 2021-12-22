import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import { getUserIdentifier } from '../user-identifier'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Contact from List',
  description: 'Remove Contact from Cordial List',
  fields: {
    identifyByKey: {
      label: 'Contact IdentifyBy key',
      description:
        'Property key by which Cordial contact should be identified. May be any primary or secondary key (e.g. cID, email, segment_id etc.)',
      type: 'string',
      required: true
    },
    identifyByValue: {
      label: 'Contact IdentifyBy value',
      description: 'Value for defined key',
      type: 'string',
      required: true
    },
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
    const list = await client.getList(payload.groupId, payload.listName)

    if (!list) {
      return true
    }
    const userIdentifier = getUserIdentifier(payload.identifyByKey, payload.identifyByValue)
    return client.removeContactFromList(userIdentifier, list)
  }
}

export default action
