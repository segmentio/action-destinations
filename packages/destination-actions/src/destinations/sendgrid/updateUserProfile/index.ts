import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  customFields,
  convertPayload,
  fetchAccountCustomFields,
  CustomField,
  getRegionalEndpoint
} from '../sendgrid-properties'
import { IntegrationError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Add or update a Contact in SendGrid.',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to SendGrid Contacts PUT API',
      description:
        'When enabled, the action will use the SendGrid Contacts PUT API to perform the batch operation. Batches can contain up to 30k records in a request.',
      default: true
    },
    first_name: {
      label: 'First Name',
      description: `The contact's first name.`,
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
      description: `The contact's last name.`,
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
      description: `The contact's country.`,
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
      description: `The contact's postal code.`,
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
      description: `The contact's city.`,
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
      description: `The contact's state.`,
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
      description: `The contact's address line 1.`,
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
      description: `The contact's address line 2.`,
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
      description: `The contact's phone number. Note: This is different from the Phone Number ID field, but the same value can be stored in both fields.`,
      type: 'string',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    whatsapp: {
      label: 'WhatsApp',
      description: `The contact's WhatsApp.`,
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
      label: 'Line',
      description: `The contact's landline.`,
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
      label: 'Facebook',
      description: `The contact's Facebook identifier.`,
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
      label: 'Unique Name',
      description: `The contact's unique name.`,
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
    primary_email: {
      label: 'Email Address',
      description: `The contact's email address.`,
      type: 'string',
      allowNull: true,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    phone_number_id: {
      label: 'Phone Number ID',
      description: `Primary Phone Number used to identify a Contact. This must be a valid phone number.`,
      type: 'string',
      allowNull: true,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    external_id: {
      label: 'External ID',
      description: `The contact's External ID.`,
      type: 'string',
      allowNull: true,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.external_id' },
          then: { '@path': '$.traits.external_id' },
          else: { '@path': '$.properties.external_id' }
        }
      }
    },
    anonymous_id: {
      label: 'Anonymous ID ',
      description: `The contact's Anonymous ID.`,
      type: 'string',
      allowNull: true,
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    customFields: customFields
  },

  perform: async (request, data) => {
    const accountCustomFields: CustomField[] = await fetchAccountCustomFields(request, data.settings)

    // Convert input payload into SendGrid Marketing Campaigns compatible request payload
    const formattedData = { contacts: [convertPayload(data.payload, accountCustomFields)] }

    const regionalEndpoint = getRegionalEndpoint(data.settings)
    // Making contacts upsert call here
    // Reference: https://docs.sendgrid.com/api-reference/contacts/add-or-update-a-contact
    return request(`${regionalEndpoint}/v3/marketing/contacts`, {
      method: 'put',
      json: formattedData
    })
  },

  performBatch: async (request, data) => {
    const n = data.payload.length
    if (n < 1) {
      throw new IntegrationError('No record to send', 'No data', 400)
    }

    const accountCustomFields: CustomField[] = await fetchAccountCustomFields(request, data.settings)

    const formattedData = { contacts: data.payload.map((p) => convertPayload(p, accountCustomFields)) }
    const regionalEndpoint = getRegionalEndpoint(data.settings)

    return request(`${regionalEndpoint}/v3/marketing/contacts`, {
      method: 'put',
      json: formattedData
    })
  }
}

export default action
