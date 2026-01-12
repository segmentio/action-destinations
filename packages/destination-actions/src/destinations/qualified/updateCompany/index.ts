import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { CompanyJSON } from './types'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Company',
  description: 'Update all Leads withing a Company in Qualified.',
  defaultSubscription: 'type = "group"',
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
      description: 'String fields to set on all Leads associated with the company.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true,
      additionalProperties: true
    },
    boolean_fields: {
      label: 'Boolean Fields',
      description: 'Boolean fields to set on all Leads associated with the company.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true,
      additionalProperties: true
    },
    number_fields: {
      label: 'Number Fields',
      description: 'Number fields to set on all Leads associated with the company.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true,
      additionalProperties: true
    }
  },
  dynamicFields: {
    string_fields: {
      __keys__: async (request: RequestClient) => {  
        return await dynamicReadFields(request, 'string')
      }
    },
    boolean_fields: {
      __keys__: async (request: RequestClient) => {  
        return await dynamicReadFields(request, 'boolean')
      }
    },
    number_fields: {
      __keys__: async (request: RequestClient) => {  
        return await dynamicReadFields(request, 'number')
      }
    }
  },
  perform: (request, { payload }) => {
    const { 
      domain,
      string_fields, 
      boolean_fields, 
      number_fields 
    } = payload

    const fields = { ...string_fields, ...boolean_fields, ...number_fields }

    const json: CompanyJSON = {
      domain,
      fields
    }

    return request(base_url + 'companies', {
      method: 'post',
      json
    })

  }
}

export default action
