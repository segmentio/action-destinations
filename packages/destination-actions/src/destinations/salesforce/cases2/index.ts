import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
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
import Salesforce, { generateSalesforceRequest } from '../sf-operations'

const OBJECT_NAME = 'Case'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Case V2',
  description: 'Create, update, or upsert cases in Salesforce.',
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
    description: {
      label: 'Description',
      description: 'A text description of the case.',
      type: 'string',
      depends_on: hideIfDeleteSyncMode
    },
    customFields: customFields2
  },
  perform: async (request, { settings, payload, syncMode }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    if (syncMode === 'add') {
      return await sf.createRecord(payload, OBJECT_NAME)
    }

    validateLookup2(syncMode, payload)

    if (syncMode === 'update') {
      return await sf.updateRecord(payload, OBJECT_NAME)
    }

    if (syncMode === 'upsert') {
      return await sf.upsertRecord(payload, OBJECT_NAME)
    }

    if (syncMode === 'delete') {
      return await sf.deleteRecord(payload, OBJECT_NAME)
    }
  },
  performBatch: async (request, { settings, payload, syncMode }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    return sf.bulkHandlerWithSyncMode(payload, OBJECT_NAME, syncMode)
  }
}

export default action
