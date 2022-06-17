import { ActionDefinition, ModifiedResponse, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
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
  description: 'Create or Update a Contact.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    role: {
      type: 'string',
      required: true,
      description: 'The role of the contact. Accepted values are `user` or `lead`. Can only be updated if `lead`.',
      label: 'Role',
      default: 'lead'
    },
    external_id: {
      type: 'string',
      description: 'A unique identifier generated outside Intercom. Required if role=user and email is blank.',
      label: 'External ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      type: 'string',
      description: "The contact's email. Required if role=user and external_id is blank.",
      label: 'Email',
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
      description: 'URL of image to be associated with contact profile.',
      type: 'string',
      format: 'uri',
      default: {
        '@path': '$.traits.avatar'
      }
    },
    signed_up_at: {
      label: 'Signed Up At',
      type: 'datetime',
      description: 'The timestamp when the contact was created.',
      default: {
        '@path': '$.createdAt'
      }
    },
    last_seen_at: {
      label: 'Timestamp',
      type: 'datetime',
      description: 'The timestamp the contact was last seen.',
      default: {
        '@path': '$.timestamp'
      }
    },
    owner_id: {
      label: 'Owner Id',
      type: 'number',
      description: 'The id of an admin that has been assigned account ownership of the contact.'
    },
    unsubscribed_from_emails: {
      label: 'Unsubscribed From Emails',
      type: 'boolean',
      description: 'Whether the contact is unsubscribed from emails.'
    },
    custom_attribute: {
      label: 'Custom Fields',
      description: 'The custom attributes which are set for the contact.',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { payload }) => {
    /**
     * Create a new intercom contact; if it exists, then search for and update the contact.
     * If the search doesn't work after a duplicate contact error (409),
     * then it's possibly a cache issue, so we'll retry
     * Note: When creating a lead, it doesn't accept an external_id (?), but it accepts an email
     */
    try {
      const response = await createIntercomContact(request, payload)
      return response
    } catch (error) {
      if (error?.response?.status === 409) {
        // The contact already exists
        const contact = await searchIntercomContact(request, payload)
        if (contact) {
          return updateIntercomContact(request, contact, payload)
        } else {
          throw new RetryableError(
            'Contact was reported duplicated but could not be searched for, probably due to Intercom search cache not being updated'
          )
        }
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

  if (response.data.total_count === 1) {
    return response.data.data[0]
  }
}

async function updateIntercomContact(request: RequestClient, contact: IntercomContact, payload: Payload) {
  return request(`https://api.intercom.io/contacts/${contact.id}`, {
    method: 'PUT',
    json: {
      ...contact,
      ...payload
    }
  })
}

export default action
