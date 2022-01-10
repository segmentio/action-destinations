import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { buildQuery } from '../sf_utils'

const API_VERSION = 'v53.0'
interface ExternalIDLookupResponse {
  Id: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Lead',
  description: 'Lead action',
  fields: {
    operation: {
      label: 'Operation',
      description: 'Operation',
      type: 'string',
      required: true,
      choices: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Upsert', value: 'upsert' }
      ]
    },
    lookup_criteria: {
      label: 'Lookup Criteria',
      description: 'Which criteria to use for update/upsert lookups',
      required: true,
      type: 'string',
      choices: [
        { label: 'External ID', value: 'external_id' },
        { label: 'Trait', value: 'trait' },
        { label: 'Record ID', value: 'record_id' }
      ]
    },
    external_id_field: {
      label: 'External ID Field',
      description: 'External ID Field',
      type: 'string'
    },
    external_id_value: {
      label: 'External ID Value',
      description: 'External ID Value',
      type: 'string'
    },
    record_id: {
      label: 'Record ID',
      description: 'Record ID',
      type: 'string'
    },
    trait_field: {
      label: 'Trait Field',
      description: 'Trait Field',
      type: 'string'
    },
    trait_value: {
      label: 'Trait Value',
      description: 'Trait Value',
      type: 'string'
    },
    company: {
      label: 'Company',
      description: 'Company',
      type: 'string',
      required: true
    },
    last_name: {
      label: 'Last Name',
      description: 'Last Name',
      type: 'string',
      required: true
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
    if (payload.operation === 'create') {
      return request(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects/Lead`, {
        method: 'post',
        json: {
          LastName: payload.last_name,
          Company: payload.company,
          FirstName: payload.first_name,
          State: payload.state,
          Street: payload.street,
          Country: payload.country,
          PostalCode: payload.postal_code,
          City: payload.city,
          Email: payload.email
        }
      })
    }

    if (payload.operation === 'update') {
      //Perform lookup based on user selected lookup criteria

      let recordId = ''

      if (payload.lookup_criteria === 'record_id') {
        if (payload.record_id === undefined) {
          throw new IntegrationError('Undefined Record ID', 'Misconfigured required field', 400)
        }

        recordId = payload.record_id
      } else if (payload.lookup_criteria === 'external_id') {
        const { Id } = await request<ExternalIDLookupResponse>(
          `${settings.instanceUrl}/services/data/${API_VERSION}/sobjects/Lead/${payload.external_id_field}/${payload.external_id_value}`
        )
        recordId = Id
      } else {
        // trait lookup
        if (payload.trait_field === undefined || payload.trait_value === undefined) {
          throw new IntegrationError('Undefined trait field or trait value', 'Misconfigured required field', 400)
        }

        const SOQLQuery = buildQuery(payload.trait_field, payload.trait_value, 'Lead')

        const { Id } = await request<ExternalIDLookupResponse>(
          `${settings.instanceUrl}/services/data/${API_VERSION}/query/${SOQLQuery}`
        )
        recordId = Id
      }

      // was there a record?
      if (recordId === '') {
        throw new IntegrationError('No record with lookup criteria found', 'Missing record', 404)
      }

      //if so Perform update
      return request(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects/Lead/${recordId}`, {
        method: 'post',
        json: {
          LastName: payload.last_name,
          Company: payload.company,
          FirstName: payload.first_name,
          State: payload.state,
          Street: payload.street,
          Country: payload.country,
          PostalCode: payload.postal_code,
          City: payload.city,
          Email: payload.email
        }
      })
    }
  }
}

export default action
