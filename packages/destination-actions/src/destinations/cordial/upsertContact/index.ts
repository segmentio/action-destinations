import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import { userIdentities } from '../user-identities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: "Upsert Cordial Contact from Segment's identify events",
  defaultSubscription: 'type = "identify"',
  fields: {
    ...userIdentities,
    attributes: {
      label: 'Contact Attributes',
      description: 'Contact Attributes mapping (atrribute_name_in_cordial -> trait_name_in_segment). Complex attribute types to be mapped via dot notation, e.g. geo_attribute.street_address -> address.street',
      type: 'object',
      required: false,
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.upsertContact(payload)
  }
}

export default action
