import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userProfilePayload, API_BASE, UPSERT_ENDPOINT } from '../insider-helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update User Profile',
  description: '',
  defaultSubscription: 'type = "identify"',
  fields: {
    age: {
      label: 'Age',
      type: 'number',
      allowNull: true,
      description: 'Age of a user.',
      default: {
        '@path': '$.traits.age'
      }
    },
    birthday: {
      label: 'Birthday',
      type: 'string',
      allowNull: true,
      description: 'User’s birthday',
      default: {
        '@path': '$.traits.birthday'
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      allowNull: true,
      description: 'Email address of a user.',
      default: {
        '@path': '$.traits.email'
      }
    },
    firstName: {
      label: 'First Name',
      description: 'First name of a user.',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.firstName'
      }
    },
    gender: {
      label: 'Gender',
      description: 'Gender of a user.',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.gender'
      }
    },
    lastName: {
      label: 'Last Name',
      description: 'Last name of a user.',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.lastName'
      }
    },
    phone: {
      label: 'Phone Number',
      description: 'Phone number of a user.',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.phone'
      }
    },
    uuid: {
      label: 'UUID',
      type: 'string',
      allowNull: false,
      description: 'User unique id.',
      default: {
        '@path': '$.userId'
      }
    },
    segment_anonymous_id: {
      label: 'Anonymous Id',
      type: 'string',
      allowNull: false,
      description: 'Anonymous user id.',
      default: {
        '@path': '$.anonymousId'
      }
    },
    city: {
      label: 'City',
      type: 'string',
      allowNull: true,
      description: 'City',
      default: {
        '@path': '$.traits.address.city'
      }
    },
    country: {
      label: 'Country',
      type: 'string',
      allowNull: true,
      description: 'Country',
      default: {
        '@path': '$.traits.address.country'
      }
    },
    emailOptin: {
      label: 'Email Optin',
      type: 'string',
      allowNull: true,
      description: 'Email optin.'
    },
    smsOptin: {
      label: 'SMS Optin',
      type: 'string',
      allowNull: true,
      description: 'SMS optin.'
    },
    whatsappOptin: {
      label: 'Whatsapp Optin',
      type: 'string',
      allowNull: true,
      description: 'Whatsapp optin.'
    },
    language: {
      label: 'Language',
      description: "The user's preferred language.",
      type: 'string',
      allowNull: true
    }
  },
  perform: (request, data) => {
    return request(`${API_BASE}${UPSERT_ENDPOINT}`, {
      method: 'post',
      json: userProfilePayload(data.payload)
    })
  }
}

export default action
