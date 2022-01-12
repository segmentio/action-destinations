import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  operation,
  lookup_criteria,
  external_id_field,
  external_id_value,
  record_id,
  trait_field,
  trait_value,
  validateLookup
} from '../sf-properties'
import Salesforce from '../sf-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Lead',
  description: 'Lead action',
  fields: {
    operation: operation,
    lookup_criteria: lookup_criteria,
    external_id_field: external_id_field,
    external_id_value: external_id_value,
    record_id: record_id,
    trait_field: trait_field,
    trait_value: trait_value,
    company: {
      label: 'Company',
      description: 'Company',
      type: 'string'
    },
    last_name: {
      label: 'Last Name',
      description: 'Last Name',
      type: 'string'
    },
    first_name: {
      label: 'First Name',
      description: 'First Name',
      type: 'string'
    },
    email: {
      label: 'Email',
      description: 'Email',
      type: 'string'
    },
    city: {
      label: 'City',
      description: 'City',
      type: 'string'
    },
    postal_code: {
      label: 'Postal Code',
      description: 'Postal Code',
      type: 'string'
    },
    country: {
      label: 'Country',
      description: 'Country',
      type: 'string'
    },
    street: {
      label: 'Street',
      description: 'Street',
      type: 'string'
    },
    state: {
      label: 'State',
      description: 'State',
      type: 'string'
    }
  },
  perform: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload.operation === 'create') {
      if (!payload.company || !payload.last_name) {
        throw new IntegrationError('Missing company or last_name value', 'Misconfigured required field', 400)
      }
      return await sf.createRecord(payload, 'Lead')
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, 'Lead')
    }

    if (payload.operation === 'upsert') {
      return await sf.upsertRecord(payload, 'Lead')
    }
  }
}

export default action
