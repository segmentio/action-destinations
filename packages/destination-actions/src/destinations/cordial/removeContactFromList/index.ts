import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import { userIdentities } from '../user-identities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Contact from List',
  description: 'Remove Contact from Cordial List',
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
    }
  },
  perform: async (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.removeContactFromList(payload)
  }
}

export default action
