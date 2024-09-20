import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpsertExternalId2,
  bulkUpdateRecordId2,
  traits2,
  customFields2,
  validateLookup2,
  enable_batching2,
  recordMatcherOperator2,
  batch_size2
} from '../sf-properties'
import Salesforce, { generateSalesforceRequest } from '../sf-operations'
import { PayloadValidationError } from '@segment/actions-core'
const OPERATIONS_WITH_CUSTOM_FIELDS = ['add', 'update', 'upsert']

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Object V2',
  description: 'Create, update, or upsert records in any custom or standard object in Salesforce.',
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
    customObjectName: {
      label: 'Salesforce Object',
      description:
        'The API name of the Salesforce object that records will be added or updated within. This can be a standard or custom object. Custom objects must be predefined in your Salesforce account and should end with "__c".',
      type: 'string',
      required: true,
      dynamic: true
    },
    customFields: customFields2
  },
  dynamicFields: {
    customObjectName: async (request, data) => {
      const sf: Salesforce = new Salesforce(
        data.settings.instanceUrl,
        await generateSalesforceRequest(data.settings, request)
      )

      return sf.customObjectName()
    }
  },
  perform: async (request, { settings, payload, syncMode }) => {
    if (!syncMode) {
      throw new PayloadValidationError('Sync mode is required for this operation.')
    }

    if (OPERATIONS_WITH_CUSTOM_FIELDS.includes(syncMode) && !payload.customFields) {
      throw new PayloadValidationError('Custom fields are required for this operation.')
    }

    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    if (syncMode === 'add') {
      return await sf.createRecord(payload, payload.customObjectName)
    }

    validateLookup2(syncMode, payload)

    if (syncMode === 'update') {
      return await sf.updateRecord(payload, payload.customObjectName)
    }

    if (syncMode === 'upsert') {
      return await sf.upsertRecord(payload, payload.customObjectName)
    }

    if (syncMode === 'delete') {
      return await sf.deleteRecord(payload, payload.customObjectName)
    }
  },
  performBatch: async (request, { settings, payload, syncMode }) => {
    if (!syncMode) {
      throw new IntegrationError('syncMode is required', 'Undefined syncMode', 400)
    }

    if (OPERATIONS_WITH_CUSTOM_FIELDS.includes(syncMode) && !payload[0].customFields) {
      throw new PayloadValidationError('Custom fields are required for this operation.')
    }

    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    return sf.bulkHandlerWithSyncMode(payload, payload[0].customObjectName, syncMode)
  }
}

export default action
