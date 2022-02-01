import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { operation, traits, validateLookup } from '../sf-properties'
import Salesforce from '../sf-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Lead',
  description: 'Lead action',
  fields: {
    operation: operation,
    traits: traits,
    company: {
      label: 'Company',
      description: "The lead's company. This is required to create a lead.",
      type: 'string'
    },
    last_name: {
      label: 'Last Name',
      description: "The lead's last name. This is required to create a lead.",
      type: 'string'
    },
    first_name: {
      label: 'First Name',
      description: "The lead's first name.",
      type: 'string'
    },
    email: {
      label: 'Email',
      description: "The lead's email address.",
      type: 'string'
    },
    city: {
      label: 'City',
      description: "City for the lead's address.",
      type: 'string'
    },
    postal_code: {
      label: 'Postal Code',
      description: "Postal code for the lead's address.",
      type: 'string'
    },
    country: {
      label: 'Country',
      description: "Country for the lead's address.",
      type: 'string'
    },
    street: {
      label: 'Street',
      description: "Street number and name for the lead's address.",
      type: 'string'
    },
    state: {
      label: 'State',
      description: "State for the lead's address.",
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
      if (!payload.company || !payload.last_name) {
        throw new IntegrationError('Missing company or last_name value', 'Misconfigured required field', 400)
      }
      return await sf.upsertRecord(payload, 'Lead')
    }
  }
}

export default action
