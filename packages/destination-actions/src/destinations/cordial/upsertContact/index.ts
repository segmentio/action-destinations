import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import { getUserIdentifier } from '../user-identifier'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: "Upsert Cordial Contact from Segment's identify events",
  defaultSubscription: 'type = "identify"',
  fields: {
    ...commonFields,
    attributes: {
      label: 'Contact Attributes',
      description: 'Contact Attributes',
      type: 'object',
      required: false,
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    const attributes = payload.attributes ? await client.transformAttributes(payload.attributes) : undefined
    const userIdentifier = getUserIdentifier(payload.identifyByKey, payload.identifyByValue)
    return client.upsertContact(userIdentifier, attributes)
  }
}

export default action
