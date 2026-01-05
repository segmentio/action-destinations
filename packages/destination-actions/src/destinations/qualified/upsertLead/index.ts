import { ActionDefinition, RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { dynamicReadFields } from './dynamic-functions'
import { base_url } from './constants'
import { JSON } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Lead',
  description: 'Send a Lead to Qualified, or update an existing Lead',
  fields: {
    email: {
      label: 'Email',
      description: 'The email address of the lead to upsert.',
      type: 'string',
      format: 'email',
      required: true,
      default: { '@path': '$.traits.email' }
    },
    phone: {
      label: 'Phone',
      description: 'The phone number of the lead to upsert.',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.phone' }
    }, 
    company: {
      label: 'Company',
      description: 'The company of the lead to upsert.',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.company' }
    },
    name: {
      label: 'Name',
      description: 'The name of the lead to upsert.',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.name' }
    },
    string_fields: {
      label: 'String Fields',
      description: 'Additional string fields to set on the lead.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true,
      additionalProperties: true
    },
    boolean_fields: {
      label: 'Boolean Fields',
      description: 'Additional boolean fields to set on the lead.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true,
      additionalProperties: true
    },
    number_fields: {
      label: 'Number Fields',
      description: 'Additional number fields to set on the lead.',
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
      email, 
      phone, 
      company, 
      name, 
      string_fields, 
      boolean_fields, 
      number_fields 
    } = payload 

    const otherFields = { ...string_fields, ...boolean_fields, ...number_fields }

    Object.entries(otherFields as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number') {
        throw new PayloadValidationError(`Invalid field value type for: ${key}. Field values must be string, number or boolean.`)
      }
    })
    
    const json: JSON = {
      email,
      fields: {
        ...(phone || phone === '' ? { phone } : {}),
        ...(company || company === '' ? { company } : {}),
        ...(name || name === '' ? { name } : {}),
        ...otherFields
      }
    }

    return request(base_url + '/leads', {
      method: 'post',
      json
    })
  }
}

export default action
