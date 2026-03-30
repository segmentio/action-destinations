import { ActionDefinition, RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { dynamicReadFields } from '../dynamic-functions'
import { base_url } from '../constants'
import type { CompanyJSON } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Company',
  description: 'Update all Leads withing a Company in Qualified.',
  defaultSubscription: 'type = "track" and event = "Leads In Company Updated"',
  fields: {
    domain: {
      label: 'Domain',
      description: 'The domain of the company to update.',
      type: 'string',
      required: true,
      default: { '@path': '$.traits.domain' }
    },
    string_fields: {
      label: 'String Fields',
      description: 'String, text or picklist field values to set on all Leads associated with the Company.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true
    },
    boolean_fields: {
      label: 'Boolean Fields',
      description: 'boolean / checkbox field values to set on all Leads associated with the Company.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true
    },
    number_fields: {
      label: 'Number Fields',
      description: 'Numeric / decimal field values to set on all Leads associated with the Company.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true
    }
  },
  dynamicFields: {
    string_fields: {
      __keys__: async (request: RequestClient) => {
        return await dynamicReadFields(request, ['string', 'picklist', 'text'], true)
      }
    },
    boolean_fields: {
      __keys__: async (request: RequestClient) => {
        return await dynamicReadFields(request, ['boolean'], true)
      }
    },
    number_fields: {
      __keys__: async (request: RequestClient) => {
        return await dynamicReadFields(request, ['decimal'], true)
      }
    }
  },
  perform: async (request, { payload }) => {
    const { domain, string_fields, boolean_fields, number_fields } = payload
    Object.entries(string_fields || ({} as Record<string, unknown>)).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        throw new PayloadValidationError(`Invalid field value for: ${key}. Should be a string.`)
      }
    })
    Object.entries(boolean_fields || ({} as Record<string, unknown>)).forEach(([key, value]) => {
      if (typeof value !== 'boolean') {
        throw new PayloadValidationError(`Invalid field value for: ${key}. Should be a boolean.`)
      }
    })
    Object.entries(number_fields || ({} as Record<string, unknown>)).forEach(([key, value]) => {
      if (typeof value !== 'number') {
        throw new PayloadValidationError(`Invalid field value for: ${key}. Should be a number.`)
      }
    })
    const json: CompanyJSON = {
      domain,
      fields: {
        ...string_fields,
        ...boolean_fields,
        ...number_fields
      }
    }
    return request(base_url + 'companies', {
      method: 'post',
      json
    })
  }
}

export default action
