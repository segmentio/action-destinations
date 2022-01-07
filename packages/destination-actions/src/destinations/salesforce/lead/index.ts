import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const API_VERSION = 'v53.0'
const action: ActionDefinition<Settings, Payload> = {
  title: 'Lead',
  description: 'Lead action',
  fields: {
    operation: {
      label: 'Operation',
      description: 'Operation',
      type: 'string',
      required: true,
      choices: [{ label: 'Create', value: 'create' }]
    },
    external_id_value: {
      label: 'External ID Value',
      description: 'External ID Value',
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
  perform: (request, { auth, settings, payload }) => {
    if (payload.operation === 'create') {
      return request(`${auth.additionalProperties.salesforce_instanceUrl}/services/data/${API_VERSION}/sobjects/Lead`, {
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
