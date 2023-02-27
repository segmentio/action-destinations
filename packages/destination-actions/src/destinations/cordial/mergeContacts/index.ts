import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from "../cordial-client";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Merge Contacts',
  description: 'Merge contacts in Cordial.',
  defaultSubscription: 'type = "alias"',
  fields: {
    segmentId: {
      label: 'New Segment User ID',
      description: 'New Segment User ID value',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      label: 'New Segment Anonymous ID',
      description: 'New Segment Anonymous ID value',
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    previousId: {
      label: 'Previous Segment ID',
      description: 'Previous Segment User or Anonymous ID value',
      type: 'string',
      required: true,
      default: { '@path': '$.previousId' }
    }
  },
  perform: async (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.mergeContacts(payload)
  }
}

export default action
