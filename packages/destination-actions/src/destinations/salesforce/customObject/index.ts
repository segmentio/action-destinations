import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpsertExternalId,
  bulkUpdateRecordId,
  operation,
  traits,
  customFields,
  validateLookup,
  enable_batching,
  recordMatcherOperator
} from '../sf-properties'
import Salesforce from '../sf-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Object',
  description: 'Create, update, or upsert records in any custom or standard object in Salesforce.',
  fields: {
    operation: operation,
    recordMatcherOperator: recordMatcherOperator,
    enable_batching: enable_batching,
    traits: traits,
    bulkUpsertExternalId: bulkUpsertExternalId,
    bulkUpdateRecordId: bulkUpdateRecordId,
    customObjectName: {
      label: 'Salesforce Object',
      description:
        'The API name of the Salesforce object that records will be added or updated within. This can be a standard or custom object. Custom objects must be predefined in your Salesforce account and should end with "__c".',
      type: 'string',
      required: true,
      dynamic: true
    },
    customFields: { ...customFields, required: true }
  },
  dynamicFields: {
    customObjectName: async (request, data) => {
      const sf: Salesforce = new Salesforce(data.settings.instanceUrl, request)

      return sf.customObjectName()
    }
  },
  perform: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload.operation === 'create') {
      return await sf.createRecord(payload, payload.customObjectName)
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, payload.customObjectName)
    }

    if (payload.operation === 'upsert') {
      return await sf.upsertRecord(payload, payload.customObjectName)
    }

    if (payload.operation === 'delete') {
      return await sf.deleteRecord(payload, payload.customObjectName)
    }
  },
  performBatch: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    return sf.bulkHandler(payload, payload[0].customObjectName)
  }
}

export default action
