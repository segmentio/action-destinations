import type { ActionDefinition } from '@segment/actions-core'
import type { InputField } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AttioClient } from '../api'

const email_address: InputField = {
  type: 'string',
  label: 'Email address',
  description: 'The email address of the person to link the user to',
  format: 'email',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.traits.email' },
      then: { '@path': '$.traits.email' },
      else: { '@path': '$.email' }
    }
  }
}

const user_attributes: InputField = {
  type: 'object',
  label: 'Additional User attributes',
  description:
    'Additional attributes to either set or update on the Attio User Record. The keys on the left should be ' +
    'Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text.',
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: true,
  properties: {
    name: {
      label: 'Name',
      type: 'string'
    }
  },
  default: {
    name: { '@path': '$.traits.name' }
  }
}

const person_attributes: InputField = {
  type: 'object',
  label: 'Additional Person attributes',
  description:
    'Additional attributes to either set or update on the Attio Person Record. The keys on the left should be ' +
    'Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text.',
  defaultObjectUI: 'keyvalue:only',
  default: {}
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Create or update an Attio User and link it to a Person based on a shared email address.',

  fields: {
    email_address,
    user_attributes,
    person_attributes
  },

  perform: async (request, data) => {
    const {
      payload: { email_address, user_attributes, person_attributes }
    } = data

    const client = new AttioClient(request)

    await client.assertRecord({
      object: 'people',
      matching_attribute: 'email_addresses',
      values: {
        email_addresses: email_address,
        ...(person_attributes ?? {})
      }
    })

    return await client.assertRecord({
      object: 'users',
      matching_attribute: 'primary_email_address',
      values: {
        primary_email_address: email_address,
        person: email_address,
        ...(user_attributes ?? {})
      }
    })
  }
}

export default action
