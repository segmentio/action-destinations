import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { customFields, convertPayload } from '../sendgrid-properties'
import { IntegrationError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sendgrid Marketing Campaign Update User Profile',
  description: 'Updating Sendgrid contacts using user profile',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Use Sendgrid Contacts PUT API which support up to 10K records in a request',
      description: 'When enabled, the action will use the Sendgrid  Contacts PUT API to perform the operation',
      default: true
    },
    first_name: {
      label: 'First Name',
      description: `The user's first name`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    last_name: {
      label: 'Last Name',
      description: `The user's last name`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    country: {
      label: 'Country',
      description: `The user's country`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.country' },
          then: { '@path': '$.traits.address.country' },
          else: { '@path': '$.properties.address.country' }
        }
      }
    },
    postal_code: {
      label: 'Postal Code',
      description: `The user's postal code`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postal_code' },
          then: { '@path': '$.traits.address.postal_code' },
          else: { '@path': '$.properties.address.postal_code' }
        }
      }
    },
    city: {
      label: 'City',
      description: `The user's city`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.city' },
          then: { '@path': '$.traits.address.city' },
          else: { '@path': '$.properties.address.city' }
        }
      }
    },
    state: {
      label: 'State',
      description: `The user's state`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.state' },
          then: { '@path': '$.traits.address.state' },
          else: { '@path': '$.properties.address.state' }
        }
      }
    },
    address_line_1: {
      label: 'Address Line 1',
      description: `The user's address line 1`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.line1' },
          then: { '@path': '$.traits.address.line1' },
          else: { '@path': '$.properties.address.line1' }
        }
      }
    },
    address_line_2: {
      label: 'Address Line 2',
      description: `The user's address line 2`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.line2' },
          then: { '@path': '$.traits.address.line2' },
          else: { '@path': '$.properties.address.line2' }
        }
      }
    },
    phone_number: {
      label: 'Phone Number',
      description: `The user's phone number`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone_number' },
          then: { '@path': '$.traits.phone_number' },
          else: { '@path': '$.properties.phone_number' }
        }
      }
    },
    whatsapp: {
      label: 'whatsapp',
      description: `The user's whatsapp`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.whatsapp' },
          then: { '@path': '$.traits.whatsapp' },
          else: { '@path': '$.properties.whatsapp' }
        }
      }
    },
    line: {
      label: 'Line Id',
      description: `The user's line id`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.line' },
          then: { '@path': '$.traits.line' },
          else: { '@path': '$.properties.line' }
        }
      }
    },
    facebook: {
      label: 'Facebook Id',
      description: `The user's facebook id`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.facebook' },
          then: { '@path': '$.traits.facebook' },
          else: { '@path': '$.properties.facebook' }
        }
      }
    },
    unique_name: {
      label: 'UniqueName',
      description: `The user's UniqueName`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.unique_name' },
          then: { '@path': '$.traits.unique_name' },
          else: { '@path': '$.properties.unique_name' }
        }
      }
    },
    identity: {
      label: 'Identity',
      description: `The user's Identity`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.identity' },
          then: { '@path': '$.traits.identity' },
          else: { '@path': '$.properties.identity' }
        }
      }
    },
    primary_email: {
      label: 'Email',
      description: `The user's email address`,
      type: 'string',
      allowNull: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    customFields: customFields
  },

  perform: (request, data) => {
    if (!data.payload.primary_email) {
      throw new IntegrationError('Missing email value', 'Misconfigured required field', 400)
    }

    // Convert input payload into sendgrid compatible request payload
    const formattedData = { contacts: [convertPayload(data.payload)] }

    // Making contacts upsert call here
    // Reference: https://docs.sendgrid.com/api-reference/contacts/add-or-update-a-contact
    return request('https://api.sendgrid.com/v3/marketing/contacts', {
      method: 'put',
      headers: {
        authorization: `Bearer ${data.settings.sendGridApiKey}`
      },
      json: formattedData
    })
  },

  performBatch: (request, data) => {
    const n = data.payload.length
    if (n < 1) {
      throw new IntegrationError('No record to send', 'No data', 400)
    }

    const formattedData = { contacts: data.payload.map(convertPayload) }
    return request('https://api.sendgrid.com/v3/marketing/contacts', {
      method: 'put',
      headers: {
        authorization: `Bearer ${data.settings.sendGridApiKey}`
      },
      json: formattedData
    })
  }
}

export default action
