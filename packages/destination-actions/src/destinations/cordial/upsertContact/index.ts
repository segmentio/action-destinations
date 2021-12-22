import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import { getUserIdentifier } from '../user-identifier'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: "Upsert Cordial Contact from Segment's identify events",
  defaultSubscription: 'type = "identify"',
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
