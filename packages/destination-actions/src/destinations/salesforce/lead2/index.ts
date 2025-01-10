import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpdateRecordId2,
  bulkUpsertExternalId2,
  customFields2,
  traits2,
  validateLookup2,
  enable_batching2,
  recordMatcherOperator2,
  batch_size2,
  hideIfDeleteSyncMode
} from '../sf-properties'
import Salesforce, { generateSalesforceRequest } from '../sf-operations'

const OBJECT_NAME = 'Lead'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Lead V2',
  description: 'Create, update, or upsert leads in Salesforce.',
  defaultSubscription: 'type = "identify"',
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
    recordMatcherOperator: recordMatcherOperator2,
    enable_batching: enable_batching2,
    batch_size: batch_size2,
    traits: traits2,
    bulkUpsertExternalId: bulkUpsertExternalId2,
    bulkUpdateRecordId: bulkUpdateRecordId2,
    customFields: customFields2,
    company: {
      label: 'Company',
      description: "The lead's company. **This is required to create a lead.**",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.company' },
          then: { '@path': '$.traits.company' },
          else: { '@path': '$.properties.company' }
        }
      },
      depends_on: hideIfDeleteSyncMode
    },
    last_name: {
      label: 'Last Name',
      description: "The lead's last name. **This is required to create a lead.**",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      },
      depends_on: hideIfDeleteSyncMode
    },
    first_name: {
      label: 'First Name',
      description: "The lead's first name.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      },
      depends_on: hideIfDeleteSyncMode
    },
    email: {
      label: 'Email',
      description: "The lead's email address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      depends_on: hideIfDeleteSyncMode
    },
    city: {
      label: 'City',
      description: "City for the lead's address.",
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
    postal_code: {
      label: 'Postal Code',
      description: "Postal code for the lead's address.",
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
    country: {
      label: 'Country',
      description: "Country for the lead's address.",
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
    street: {
      label: 'Street',
      description: "Street number and name for the lead's address.",
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
    state: {
      label: 'State',
      description: "State for the lead's address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.state' },
          then: { '@path': '$.traits.address.state' },
          else: { '@path': '$.properties.address.state' }
        }
      },
      depends_on: hideIfDeleteSyncMode
    }
  },
  perform: async (request, { settings, payload, syncMode }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    if (syncMode === 'add') {
      if (!payload.last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
      }
      return await sf.createRecord(payload, OBJECT_NAME)
    }

    validateLookup2(syncMode, payload)

    if (syncMode === 'update') {
      return await sf.updateRecord(payload, OBJECT_NAME)
    }

    if (syncMode === 'upsert') {
      if (!payload.last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
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
      if (!payload[0].last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
      }
    }

    return sf.bulkHandlerWithSyncMode(payload, OBJECT_NAME, syncMode)
  }
}

export default action
