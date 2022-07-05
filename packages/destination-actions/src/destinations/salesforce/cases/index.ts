import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpsertExternalId,
  bulkUpdateRecordId,
  customFields,
  operation,
  traits,
  validateLookup
} from '../sf-properties'
import Salesforce from '../sf-operations'

const OBJECT_NAME = 'Case'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Case',
  description: 'Represents a case, which is a customer issue or problem.',
  fields: {
    test_dynamic_field: {
      label: 'Test Dynamic Field',
      description: 'A test dynamic field.',
      type: 'string',
      dynamic: true
    },
    operation: operation,
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
  dynamicFields: {
    test_dynamic_field: async (request, _data) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const res = await request<string>('https://test-dynamic-fields.nick-aguilar.workers.dev/', {
        method: 'GET'
      })
      return {
        body: {
          data: [
            { label: res.content, value: `test1 ${res.content}` },
            { label: `${res.content} test2`, value: `test2 ${res.content}` }
          ],
          pagination: { nextPage: '2' }
        }
      }
    }
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

    return sf.bulkHandler(payload, OBJECT_NAME)
  }
}

export default action
