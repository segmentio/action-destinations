import type { ActionDefinition } from '@segment/actions-core'
import { omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Create or update a contact in Collab Travel CRM.',
  defaultSubscription: 'type = "identify"',

  fields: {
    email: {
      label: 'Email',
      description: 'The email address of the contact.',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@path': '$.traits.email'
      }
    },
    firstName: {
      label: 'First Name',
      description: 'The first name of the contact.',
      type: 'string',
      default: {
        '@path': '$.traits.first_name'
      }
    },
    lastName: {
      label: 'Last Name',
      description: 'The last name of the contact.',
      type: 'string',
      default: {
        '@path': '$.traits.last_name'
      }
    },
    phone: {
      label: 'Phone',
      description: 'The phone number of the contact.',
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    userId: {
      label: 'User ID',
      description: 'The unique identifier for the user.',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      label: 'Additional Traits',
      description: 'Additional user traits to sync.',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { payload }) => {
    const { ...otherTraits } = omit(payload.traits, ['email', 'firstName', 'lastName', 'phone']) || {}
    const { email, firstName, lastName, phone } = payload
    const body = {
      type: 'identify',
      userId: payload.userId,
      traits: {
        email,
        firstName,
        lastName,
        phone,
        ...otherTraits
      }
    }

    return request(`${COLLAB_CRM_BASE_URL}/segment-destination`, {
      method: 'POST',
      json: body
    })
  }
}

export default action
