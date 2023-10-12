import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userProfilePayload, API_BASE, UPSERT_ENDPOINT } from '../insider-helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update a User Profile',
  description: "Action used to update a User's attribute in Insider InOne.",
  defaultSubscription: 'type = "identify"',
  fields: {
    email_as_identifier: {
      label: 'Treat Email as Identifier',
      type: 'boolean',
      description: 'If true, Email will be sent as identifier to Insider.',
      default: true
    },
    phone_number_as_identifier: {
      label: 'Treat Phone Number as Identifier',
      type: 'boolean',
      description: 'If true, Phone Number will be sent as identifier to Insider',
      default: true
    },
    age: {
      label: 'Age',
      type: 'number',
      description: 'Age of a user.',
      default: {
        '@path': '$.traits.age'
      }
    },
    birthday: {
      label: 'Birthday',
      type: 'string',
      description: 'User’s birthday',
      default: {
        '@path': '$.traits.birthday'
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'Email address of a user.',
      default: {
        '@path': '$.traits.email'
      }
    },
    firstName: {
      label: 'First Name',
      description: 'First name of a user.',
      type: 'string',
      default: {
        '@path': '$.traits.first_name'
      }
    },
    gender: {
      label: 'Gender',
      description: 'Gender of a user.',
      type: 'string',
      default: {
        '@path': '$.traits.gender'
      }
    },
    lastName: {
      label: 'Last Name',
      description: 'Last name of a user.',
      type: 'string',
      default: {
        '@path': '$.traits.last_name'
      }
    },
    phone: {
      label: 'Phone Number',
      description: "User's phone number in E.164 format (e.g. +6598765432), can be used as an identifier.",
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    uuid: {
      label: 'UUID',
      type: 'string',
      description:
        "User's unique identifier. The UUID string is used as identifier when sending data to Insider. UUID is required if the Anonymous Id field is empty.",
      default: {
        '@path': '$.userId'
      }
    },
    segment_anonymous_id: {
      label: 'Anonymous Id',
      type: 'string',
      description:
        'An Anonymous Identifier. The Anonymous Id string is used as identifier when sending data to Insider. Anonymous Id is required if the UUID field is empty.',
      default: {
        '@path': '$.anonymousId'
      }
    },
    city: {
      label: 'City',
      type: 'string',
      description: 'City',
      default: {
        '@path': '$.traits.address.city'
      }
    },
    country: {
      label: 'Country',
      type: 'string',
      description: 'Country',
      default: {
        '@path': '$.traits.address.country'
      }
    },
    gdprOptin: {
      label: 'GDPR Opt-in',
      type: 'boolean',
      default: undefined,
      description: 'GDPR opt-in.'
    },
    emailOptin: {
      label: 'Email Opt-in',
      type: 'boolean',
      default: undefined,
      description: 'Email opt-in.'
    },
    smsOptin: {
      label: 'SMS Opt-in',
      type: 'boolean',
      default: undefined,
      description: 'SMS opt-in.'
    },
    whatsappOptin: {
      label: 'Whatsapp Opt-in',
      type: 'boolean',
      default: undefined,
      description: 'Whatsapp opt-in.'
    },
    language: {
      label: 'Language',
      description: "The user's preferred language.",
      type: 'string'
    },
    custom: {
      label: 'Other Properties',
      description: "The user's additional information.",
      type: 'object'
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
