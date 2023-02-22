import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import userIdentityFields from "../identities-fields";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Contact from List',
  description: 'Remove Contact from Cordial List',
  fields: {
    ...userIdentityFields,
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
