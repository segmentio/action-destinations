import { ActionDefinition, ModifiedResponse, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// https://developers.intercom.com/intercom-api-reference/reference/search-for-contacts
interface IntercomSearchData {
  total_count: number
  data: Array<IntercomUser>
}

interface IntercomUser {
  id: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Create or Update a Contact',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    role: {
      type: 'string',
      required: true,
      description: 'The role of the contact. Accepted values are `user` or `lead`. Can only be updated if `lead`',
      label: 'Role',
      default: 'user'
    },
    external_id: {
      // required if role=user and email is blank
      type: 'string',
      description: 'A unique identifier generated outside Intercom',
      label: 'External ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      // required if role=user and external_id is blank
      type: 'string',
      description: "The user's email",
      label: 'Email',
      format: 'email',
      default: {
        '@path': '$.traits.email'
      }
    },
    phone: {
      label: 'Phone Number',
      description: "The user's phone number",
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    name: {
      // required if role=user and external_id is blank
      type: 'string',
      description: "The user's name",
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    avatar: {
      label: 'Avatar',
      description: 'URL of image to be associated with user profile.',
      type: 'string',
      format: 'uri',
      default: {
        '@path': '$.traits.avatar'
      }
    },
    signed_up_at: {
      label: 'Signed Up At',
      type: 'datetime',
      description: 'The timestamp when the contact was created',
      default: {
        '@path': '$.createdAt'
      }
    },
    last_seen_at: {
      label: 'Timestamp',
      type: 'datetime',
      description: 'The timestamp the user was last seen',
      default: {
        '@path': '$.timestamp'
      }
    },
    owner_id: {
      label: 'Owner Id',
      type: 'number',
      description: 'The id of an admin that has been assigned account ownership of the contact'
    },
    unsubscribed_from_emails: {
      label: 'Unsubscribed From Emails',
      type: 'boolean',
      description: 'Whether the contact is unsubscribed from emails'
    },
    custom_attribute: {
      label: 'Custom Fields',
      description: 'The custom attributes which are set for the contact',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { payload }) => {
    // https://developers.intercom.com/intercom-api-reference/reference/create-contact
    // https://developers.intercom.com/intercom-api-reference/reference/update-contact
    //
    // When creating a lead, it doesn't accept an external_id (?), but it accepts an email
    //
    try {
      const response = await createIntercomUser(request, payload)
      return response
    } catch (error) {
      if (error?.response?.status === 409) {
        // The user already exists
        console.log('errored')
        const user = await searchIntercomUser(request, payload)
        if (user) {
          return updateIntercomUser(request, user, payload)
        } else {
          throw new RetryableError(
            'User was reported duplicated but could not be searched for, probably due to Intercom search cache not being updated'
          )
        }
      }
      throw error
    }
  }
}

async function createIntercomUser(request: RequestClient, payload: Payload) {
  return request('https://api.intercom.io/contacts', {
    method: 'POST',
    json: payload
  })
}

/**
 * If there is a duplicate user found, then search for the id of the user.
 * Note: leads can have duplicate emails (and so the creation can never throw a 409),
 * but users can't.
 */
async function searchIntercomUser(request: RequestClient, payload: Payload) {
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

async function updateIntercomUser(request: RequestClient, user: IntercomUser, payload: Payload) {
  return request(`https://api.intercom.io/contacts/${user.id}`, {
    method: 'PUT',
    json: {
      ...user,
      ...payload
    }
  })
}

export default action
