import { ActionDefinition, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { convertValidTimestamp, getUniqueIntercomContact } from '../util'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Contact',
  description: 'Create or update a contact in Intercom',
  defaultSubscription: 'type = "identify"',
  fields: {
    role: {
      type: 'string',
      required: true,
      description: 'The role of the contact. Accepted values are `user` or `lead`.',
      label: 'Role',
      choices: [
        { label: 'Lead', value: 'lead' },
        { label: 'User', value: 'user' }
      ]
    },
    external_id: {
      type: 'string',
      description:
        'A unique identifier for the contact generated outside of Intercom. External ID is required if the role is `user` and email is blank. External IDs cannot be set if the role is `lead`.',
      label: 'External ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      type: 'string',
      description: "The contact's email address. Email is required if the role is `user` and External ID is blank.",
      label: 'Email Address',
      format: 'email',
      default: {
        '@path': '$.traits.email'
      }
    },
    phone: {
      label: 'Phone Number',
      description: "The contact's phone number.",
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    name: {
      type: 'string',
      description: "The contact's name.",
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    avatar: {
      label: 'Avatar',
      description: 'An image URL containing the avatar of a contact.',
      type: 'string',
      format: 'uri',
      default: {
        '@path': '$.traits.avatar'
      }
    },
    signed_up_at: {
      label: 'Signed Up Timestamp',
      type: 'datetime',
      description: 'The time specified for when a contact signed up.'
    },
    last_seen_at: {
      label: 'Last Seen Timestamp',
      type: 'datetime',
      description: 'The time when the contact was last seen.',
      default: {
        '@path': '$.timestamp'
      }
    },
    owner_id: {
      label: 'Owner ID',
      type: 'number',
      description: 'The ID of an admin that has been assigned account ownership of the contact.'
    },
    unsubscribed_from_emails: {
      label: 'Unsubscribed From Emails',
      type: 'boolean',
      description: "The contact's email unsubscribe status."
    },
    custom_attributes: {
      label: 'Custom Attributes',
      description:
        'The custom attributes which are set for the contact. You can only write to custom attributes that already exist in your Intercom workspace. Please ensure custom attributes are created in Intercom first. See [Intercom documentation](https://developers.intercom.com/intercom-api-reference/reference/create-data-attributes) for more information on creating attributes.',
      type: 'object',
      defaultObjectUI: 'keyvalue'
    }
  },
  perform: async (request, { payload }) => {
    /**
     * Searches for a contact with the given payload.
     * If unique user is found, updates the contact first.
     * If no contact (or many) are found, then we create a new contact.
     *
     * This is because we anticipate many more updates than creations happening in practice.
     *
     * Note: When creating a lead, Intercom doesn't accept an external_id; Intercom only accepts email.
     */
    payload.signed_up_at = convertValidTimestamp(payload.signed_up_at)
    payload.last_seen_at = convertValidTimestamp(payload.last_seen_at)
    try {
      const contact = await getUniqueIntercomContact(request, payload)
      if (contact) {
        return updateIntercomContact(request, contact.id, payload)
      }
      return await createIntercomContact(request, payload)
    } catch (error) {
      if (error?.response?.status === 409) {
        // The contact already exists but the Intercom cache most likely wasn't updated yet
        throw new RetryableError(
          'Contact was reported duplicated but could not be searched for, probably due to Intercom search cache not being updated'
        )
      }
      throw error
    }
  }
}

async function createIntercomContact(request: RequestClient, payload: Payload) {
  return request('https://api.intercom.io/contacts', {
    method: 'POST',
    json: payload
  })
}

async function updateIntercomContact(request: RequestClient, contactId: String, payload: Payload) {
  return request(`https://api.intercom.io/contacts/${contactId}`, {
    method: 'PUT',
    json: payload
  })
}

export default action
