import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Create or update a contact in Cordial.',
  defaultSubscription: 'type = "identify"',
  fields: {
    userIdentities: {
      label: 'User Identities',
      description:
        'An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. If a contact is found using the identifiers it is updated, otherwise a new contact is created.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    },
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
