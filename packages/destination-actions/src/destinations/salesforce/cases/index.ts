import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { customFields, operation, traits, validateLookup } from '../sf-properties'
import Salesforce from '../sf-operations'

const objectName = 'Case'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Case',
  description: 'Represents a case, which is a customer issue or problem.',
  fields: {
    operation: operation,
    traits: traits,
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
      return await sf.createRecord(payload, objectName)
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, objectName)
    }

    if (payload.operation === 'upsert') {
      return await sf.upsertRecord(payload, objectName)
    }
  },
  performBatch: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload[0].operation === 'bulkUpsert') {
      return await sf.bulkUpsert(payload, objectName)
    }
  }
}

export default action
