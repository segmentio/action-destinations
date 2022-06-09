import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpsertExternalId,
  operation,
  traits,
  customFields,
  validateLookup,
  thowBulkMismatchError
} from '../sf-properties'
import Salesforce from '../sf-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Object',
  description:
    "Represents a custom object, which you create to store information that's specific to your company or industry, or a standard object.",
  fields: {
    operation: operation,
    traits: traits,
    bulkUpsertExternalId: bulkUpsertExternalId,
    customObjectName: {
      label: 'Salesforce Object',
      description:
        'The API name of the Salesforce object that records will be added or updated within. This can be a standard or custom object. Custom objects must be predefined in your Salesforce account and should end with "__c".',
      type: 'string',
      required: true
    },
    customFields: { ...customFields, required: true }
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
  },
  performBatch: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload[0].operation === 'bulkUpsert') {
      return await sf.bulkUpsert(payload, payload[0].customObjectName)
    } else if (payload[0].operation === 'bulkUpdate') {
      return await sf.bulkUpdate(payload, payload[0].customObjectName)
    } else {
      thowBulkMismatchError()
    }
  }
}

export default action
