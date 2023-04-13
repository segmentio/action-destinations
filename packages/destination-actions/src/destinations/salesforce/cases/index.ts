import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpsertExternalId,
  bulkUpdateRecordId,
  customFields,
  operation,
  traits,
  validateLookup,
  enable_batching,
  recordMatcherOperator
} from '../sf-properties'
import Salesforce from '../sf-operations'

const OBJECT_NAME = 'Case'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Case',
  description: 'Create, update, or upsert cases in Salesforce.',
  fields: {
    operation: operation,
    recordMatcherOperator: recordMatcherOperator,
    enable_batching: enable_batching,
    traits: traits,
    bulkUpsertExternalId: bulkUpsertExternalId,
    bulkUpdateRecordId: bulkUpdateRecordId,
    description: {
      label: 'Description',
      description: 'A text description of the case.',
      type: 'string'
    },
    customFields: customFields
  },
  perform: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload.operation === 'create') {
      return await sf.createRecord(payload, OBJECT_NAME)
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, OBJECT_NAME)
    }

    if (payload.operation === 'upsert') {
      return await sf.upsertRecord(payload, OBJECT_NAME)
    }

    if (payload.operation === 'delete') {
      return await sf.deleteRecord(payload, OBJECT_NAME)
    }
  },
  performBatch: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    return sf.bulkHandler(payload, OBJECT_NAME)
  }
}

export default action
