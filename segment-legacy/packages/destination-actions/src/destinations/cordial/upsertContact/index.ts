import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import userIdentityFields from '../identities-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Create or update a contact in Cordial.',
  defaultSubscription: 'type = "identify"',
  fields: {
    ...userIdentityFields,
    attributes: {
      label: 'Contact Attributes',
      description:
        'Contact attributes to update. Optional. Contact attributes must exist in Cordial prior to updating. Attributes that do not exist in Cordial will be ignored. Complex attribute types to be mapped via dot notation, for example, `cordialPerson.first_name -> traits.segmentPerson.firstName`, `cordialPerson.last_name -> traits.segmentPerson.lastName`. Segment trait address can be mapped directly to geo Cordial attribute: `geo_cordial_attribute -> traits.address`.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: async (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.upsertContact(payload)
  }
}

export default action
