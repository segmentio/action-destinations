import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import Salesforce, { generateSalesforceRequest } from '../sf-operations'
import {
  bulkUpsertExternalId2,
  bulkUpdateRecordId2,
  customFields2,
  traits2,
  validateLookup2,
  enable_batching2,
  recordMatcherOperator2,
  batch_size2,
  hideIfDeleteSyncMode
} from '../sf-properties'
import type { Payload } from './generated-types'

const OBJECT_NAME = 'Account'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Account V2',
  description: 'Create, update, or upsert accounts in Salesforce.',
  defaultSubscription: 'type = "group"',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'add',
    choices: [
      { label: 'Insert Records', value: 'add' },
      { label: 'Update Records', value: 'update' },
      { label: 'Upsert Records', value: 'upsert' },
      { label: 'Delete Records. Not available when using batching. Requests will result in errors.', value: 'delete' }
    ]
  },
  fields: {
    enable_batching: enable_batching2,
    batch_size: batch_size2,
    recordMatcherOperator: recordMatcherOperator2,
    traits: traits2,
    bulkUpsertExternalId: bulkUpsertExternalId2,
    bulkUpdateRecordId: bulkUpdateRecordId2,
    name: {
      label: 'Name',
      description: 'Name of the account. **This is required to create an account.**',
      type: 'string',
      default: {
        '@path': '$.traits.name'
      },
      depends_on: hideIfDeleteSyncMode
    },
    account_number: {
      label: 'Account Number',
      description:
        'Account number assigned to the account. This is not the unique, Salesforce-generated ID assigned during creation.',
      type: 'string',
      default: {
        '@path': '$.groupId'
      },
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
    },
    shipping_city: {
      label: 'Shipping City',
      description: 'City for the shipping address of the account.',
      type: 'string',
      depends_on: hideIfDeleteSyncMode
    },
    shipping_postal_code: {
      label: 'Shipping Postal Code',
      description: 'Postal code for the shipping address of the account.',
      type: 'string',
      depends_on: hideIfDeleteSyncMode
    },
    shipping_country: {
      label: 'Shipping Country',
      description: 'Country for the shipping address of the account.',
      type: 'string',
      depends_on: hideIfDeleteSyncMode
    },
    shipping_street: {
      label: 'Shipping Street',
      description: 'Street address for the shipping address of the account.',
      type: 'string',
      depends_on: hideIfDeleteSyncMode
    },
    shipping_state: {
      label: 'Shipping State',
      description: 'State for the shipping address of the account.',
      type: 'string',
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
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
      },
      depends_on: hideIfDeleteSyncMode
    },
    customFields: customFields2
  },
  perform: async (request, { settings, payload, syncMode }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    if (syncMode === 'add') {
      if (!payload.name) {
        throw new IntegrationError('Missing name value', 'Misconfigured required field', 400)
      }
      return await sf.createRecord(payload, OBJECT_NAME)
    }

    validateLookup2(syncMode, payload)

    if (syncMode === 'update') {
      return await sf.updateRecord(payload, OBJECT_NAME)
    }

    if (syncMode === 'upsert') {
      if (!payload.name) {
        throw new IntegrationError('Missing name value', 'Misconfigured required field', 400)
      }
      return await sf.upsertRecord(payload, OBJECT_NAME)
    }

    if (syncMode === 'delete') {
      return await sf.deleteRecord(payload, OBJECT_NAME)
    }
  },
  performBatch: async (request, { settings, payload, syncMode }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    if (syncMode === 'upsert') {
      if (!payload[0].name) {
        throw new IntegrationError('Missing name value', 'Misconfigured required field', 400)
      }
    }

    return sf.bulkHandlerWithSyncMode(payload, OBJECT_NAME, syncMode)
  }
}

export default action
