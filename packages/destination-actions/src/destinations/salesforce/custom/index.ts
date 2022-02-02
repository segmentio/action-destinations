import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { operation, traits, custom_fields, validateLookup } from '../sf-properties'
import Salesforce from '../sf-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Object',
  description: 'Custom Object',
  fields: {
    operation: operation,
    traits: traits,
    sobject: {
      label: 'Salesforce Object',
      description:
        'The name of the Salesforce object that records will be added or updated within. The object must be predefined in your Salesforce account. Values should end with "__c".',
      type: 'string',
      required: true
    },
    custom_fields: { ...custom_fields, required: true }
  },
  perform: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (!payload.sobject.endsWith('__c')) {
      payload.sobject += '__c'
    }

    if (payload.operation === 'create') {
      return await sf.createRecord(payload, payload.sobject)
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, payload.sobject)
    }

    if (payload.operation === 'upsert') {
      return await sf.upsertRecord(payload, payload.sobject)
    }
  }
}

export default action
