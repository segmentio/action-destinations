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

const user_id: InputField = {
  type: 'string',
  label: 'ID',
  description: 'The ID of the User',
  format: 'text',
  required: true,
  default: { '@path': '$.userId' }
}

const user_attributes: InputField = {
  type: 'object',
  label: 'Additional User attributes',
  description:
    'Additional attributes to either set or update on the Attio User Record. The values on the left should be ' +
    'Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs. ' +
    'For example: traits.name → name',
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: true,
  properties: {},
  default: {}
}

const person_attributes: InputField = {
  type: 'object',
  label: 'Additional Person attributes',
  description:
    'Additional attributes to either set or update on the Attio Person Record. The values on the left should be ' +
    'Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs. ' +
    'For example: traits.name → name',
  defaultObjectUI: 'keyvalue:only',
  default: {}
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Create or update an Attio User and link it to a Person based on a shared email address.',

  fields: {
    email_address,
    user_id,
    user_attributes,
    person_attributes
  },

  perform: async (request, { payload }) => {
    const client = new AttioClient(request)

    await client.assertRecord({
      object: 'people',
      matching_attribute: 'email_addresses',
      values: {
        email_addresses: payload.email_address,
        ...(payload.person_attributes ?? {})
      }
    })

    return await client.assertRecord({
      object: 'users',
      matching_attribute: 'user_id',
      values: {
        primary_email_address: payload.email_address,
        person: payload.email_address,
        user_id: payload.user_id,
        ...(payload.user_attributes ?? {})
      }
    })
  }
}

export default action
