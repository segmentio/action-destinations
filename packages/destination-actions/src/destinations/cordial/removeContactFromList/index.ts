import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Contact from List',
  description: 'Remove Contact from Cordial List',
  fields: {
    userIdentities: {
      label: 'User Identities',
      description:
        'An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> userId`. At least one identifier should be valid otherwise the contact will not be identified and the request will be ignored.',
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
    }
  },
  perform: async (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.removeContactFromList(payload)
  }
}

export default action
