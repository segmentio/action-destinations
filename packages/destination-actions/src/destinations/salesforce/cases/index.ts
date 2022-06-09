import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpsertExternalId,
  customFields,
  operation,
  traits,
  validateLookup,
  thowBulkMismatchError
} from '../sf-properties'
import Salesforce from '../sf-operations'

const OBJECT_NAME = 'Case'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Case',
  description: 'Represents a case, which is a customer issue or problem.',
  fields: {
    operation: operation,
    traits: traits,
    bulkUpsertExternalId: bulkUpsertExternalId,
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
  },
  performBatch: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload[0].operation === 'bulkUpsert') {
      return await sf.bulkUpsert(payload, OBJECT_NAME)
    } else if (payload[0].operation === 'bulkUpdate') {
      return await sf.bulkUpdate(payload, OBJECT_NAME)
    } else {
      thowBulkMismatchError()
    }
  }
}

export default action
