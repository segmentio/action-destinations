import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import Salesforce from '../sf-operations'
import { customFields, operation, traits, validateLookup } from '../sf-properties'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Account',
  description: 'Account action',
  fields: {
    operation: operation,
    traits: traits,
    name: {
      label: 'Name',
      description: 'Name of the account. This is required to create an account.',
      type: 'string',
      default: {
        '@path': '$.name'
      }
    },
    account_number: {
      label: 'Account Number',
      description:
        'Account number assigned to the account. This is not the unique, system-generated ID assigned during creation.',
      type: 'string',
      default: {
        '@path': '$.groupId'
      }
    },
    number_of_employees: {
      label: 'Number of employees',
      description: 'Number of employees working at the company represented by the account.',
      type: 'integer',
      default: {
        '@if': {
          exists: { '@path': '$.traits.employees' },
          then: { '@path': '$.traits.employees' },
          else: { '@path': '$.properties.employees' }
        }
      }
    },
    billing_city: {
      label: 'Billing City',
      description: 'City for the billing address of the account.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.city' },
          then: { '@path': '$.traits.address.city' },
          else: { '@path': '$.properties.address.city' }
        }
      }
    },
    billing_postal_code: {
      label: 'Billing Postal Code',
      description: 'Postal code for the billing address of the account.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postal_code' },
          then: { '@path': '$.traits.address.postal_code' },
          else: { '@path': '$.properties.address.postal_code' }
        }
      }
    },
    billing_country: {
      label: 'Billing Country',
      description: 'Country for the billing address of the account.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.country' },
          then: { '@path': '$.traits.address.country' },
          else: { '@path': '$.properties.address.country' }
        }
      }
    },
    billing_street: {
      label: 'Billing Street',
      description: 'Street address for the billing address of the account.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.street' },
          then: { '@path': '$.traits.address.street' },
          else: { '@path': '$.properties.address.street' }
        }
      }
    },
    billing_state: {
      label: 'Billing State',
      description: 'State for the billing address of the account.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.state' },
          then: { '@path': '$.traits.address.state' },
          else: { '@path': '$.properties.address.state' }
        }
      }
    },
    shipping_city: {
      label: 'Shipping City',
      description: 'City for the shipping address of the account.',
      type: 'string'
    },
    shipping_postal_code: {
      label: 'Shipping Postal Code',
      description: 'Postal code for the shipping address of the account.',
      type: 'string'
    },
    shipping_country: {
      label: 'Shipping Country',
      description: 'Country for the shipping address of the account.',
      type: 'string'
    },
    shipping_street: {
      label: 'Shipping Street',
      description: 'Street address for the shipping address of the account.',
      type: 'string'
    },
    shipping_state: {
      label: 'Shipping State',
      description: 'State for the shipping address of the account.',
      type: 'string'
    },
    phone: {
      label: 'Phone',
      description: 'Phone number for the account.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    description: {
      label: 'Description',
      description: 'Text description of the account.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.description' },
          then: { '@path': '$.traits.description' },
          else: { '@path': '$.properties.description' }
        }
      }
    },
    website: {
      label: 'Website',
      description: 'The website of the account.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.website' },
          then: { '@path': '$.traits.website' },
          else: { '@path': '$.properties.website' }
        }
      }
    },
    customFields: customFields
  },
  perform: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload.operation === 'create') {
      if (!payload.name) {
        throw new IntegrationError('Missing name value', 'Misconfigured required field', 400)
      }
      return await sf.createRecord(payload, 'Account')
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, 'Account')
    }

    if (payload.operation === 'upsert') {
      if (!payload.name) {
        throw new IntegrationError('Missing name value', 'Misconfigured required field', 400)
      }
      return await sf.upsertRecord(payload, 'Account')
    }
  }
}

export default action
