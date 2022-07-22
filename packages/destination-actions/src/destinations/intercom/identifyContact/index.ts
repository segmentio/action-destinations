import { ActionDefinition, ModifiedResponse, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { convertValidTimestamp } from '../util'
import type { Payload } from './generated-types'

interface IntercomSearchData {
  total_count: number
  data: Array<IntercomContact>
}

interface IntercomContact {
  id: string
}

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
        'A unique identifier for the contact generated outside Intercom. External ID is required if the role is `user` and email is blank.',
      label: 'External ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      type: 'string',
      description: "The contact's email address. Email is required if the role is `user` and external ID is blank.",
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
     * Tries to search and update the contact first. If no contact is found, then create.
     * This is because we anticipate many more updates than creations happening in practice.
     *
     * Note: When creating a lead, Intercom doesn't accept an external_id; they only accept email.
     */
    payload.signed_up_at = convertValidTimestamp(payload.signed_up_at)
    payload.last_seen_at = convertValidTimestamp(payload.last_seen_at)
    try {
      const contact = await searchIntercomContact(request, payload)
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

// Intercom's API Docs - https://developers.intercom.com/intercom-api-reference/reference/update-contact
async function createIntercomContact(request: RequestClient, payload: Payload) {
  return request('https://api.intercom.io/contacts', {
    method: 'POST',
    json: payload
  })
}

/**
 * If there is a duplicate contact found, then search for the id of the contact.
 * Note: contact leads can have duplicate emails (and so the creation can never throw a 409),
 * but contact users can't.
 *
 * Intercom's API Docs - https://developers.intercom.com/intercom-api-reference/reference/search-for-contacts
 */
async function searchIntercomContact(request: RequestClient, payload: Payload) {
  const searchFields = {
    email: payload.email,
    external_id: payload.external_id,
    role: payload.role
  }
  const value = []
  for (const [key, fieldValue] of Object.entries(searchFields)) {
    if (fieldValue) {
      value.push({
        field: key,
        operator: '=',
        value: fieldValue
      })
    }
  }

  const query = {
    operator: 'AND',
    value
  }

  const response: ModifiedResponse<IntercomSearchData> = await request('https://api.intercom.io/contacts/search', {
    method: 'POST',
    json: { query }
  })

  if (response?.data?.total_count === 1) {
    return response.data.data[0]
  }
}

async function updateIntercomContact(request: RequestClient, contactId: String, payload: Payload) {
  return request(`https://api.intercom.io/contacts/${contactId}`, {
    method: 'PUT',
    json: payload
  })
}

export default action
