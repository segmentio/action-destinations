import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { operation, traits, customFields, validateLookup } from '../sf-properties'
import Salesforce from '../sf-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Object',
  description: 'Custom Object',
  fields: {
    operation: operation,
    traits: traits,
    customObjectName: {
      label: 'Salesforce Object',
      description:
        'The API name of the Salesforce object that records will be added or updated within. The object must be predefined in your Salesforce account. Values should end with "__c".',
      type: 'string',
      required: true
    },
    customFields: { ...customFields, required: true }
  },
  perform: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (!payload.customObjectName.endsWith('__c')) {
      payload.customObjectName += '__c'
    }

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
  }
}

export default action
