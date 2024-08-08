import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import Salesforce, { generateSalesforceRequest } from '../sf-operations'
import {
  bulkUpsertExternalId,
  bulkUpdateRecordId,
  customFields,
  traits,
  validateLookup,
  enable_batching,
  recordMatcherOperator,
  batch_size,
  hideIfDeleteOperation
} from '../sf-properties'
import type { Payload } from './generated-types'

const OBJECT_NAME = 'Opportunity'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Opportunity V2',
  description: 'Create, update, or upsert opportunities in Salesforce.',
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
    recordMatcherOperator: recordMatcherOperator,
    enable_batching: enable_batching,
    batch_size: batch_size,
    traits: traits,
    bulkUpsertExternalId: bulkUpsertExternalId,
    bulkUpdateRecordId: bulkUpdateRecordId,
    close_date: {
      label: 'Close Date',
      description:
        'Date when the opportunity is expected to close. Use yyyy-MM-dd format. **This is required to create an opportunity.**',
      type: 'string',
      depends_on: hideIfDeleteOperation
    },
    name: {
      label: 'Name',
      description: 'A name for the opportunity. **This is required to create an opportunity.**',
      type: 'string',
      depends_on: hideIfDeleteOperation
    },
    stage_name: {
      label: 'Stage Name',
      description: 'Current stage of the opportunity. **This is required to create an opportunity.**',
      type: 'string',
      depends_on: hideIfDeleteOperation
    },
    amount: {
      label: 'Amount',
      description: 'Estimated total sale amount.',
      type: 'string',
      depends_on: hideIfDeleteOperation
    },
    description: {
      label: 'Description',
      description: 'A text description of the opportunity.',
      type: 'string',
      depends_on: hideIfDeleteOperation
    },
    customFields: customFields
  },
  perform: async (request, { settings, payload, syncMode }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    if (syncMode === 'add') {
      if (!payload.close_date || !payload.name || !payload.stage_name) {
        throw new IntegrationError('Missing close_date, name or stage_name value', 'Misconfigured required field', 400)
      }
      return await sf.createRecord(payload, OBJECT_NAME)
    }

    validateLookup(payload)

    if (syncMode === 'update') {
      return await sf.updateRecord(payload, OBJECT_NAME)
    }

    if (syncMode === 'upsert') {
      if (!payload.close_date || !payload.name || !payload.stage_name) {
        throw new IntegrationError('Missing close_date, name or stage_name value', 'Misconfigured required field', 400)
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
      if (!payload[0].close_date || !payload[0].name || !payload[0].stage_name) {
        throw new IntegrationError('Missing close_date, name or stage_name value', 'Misconfigured required field', 400)
      }
    }

    return sf.bulkHandlerWithSyncMode(payload, OBJECT_NAME, syncMode)
  }
}

export default action
