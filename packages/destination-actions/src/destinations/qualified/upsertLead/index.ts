import { ActionDefinition, RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { dynamicReadFields } from '../dynamic-functions'
import { base_url } from '../constants'
import { LeadJSON } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Lead',
  description: 'Send a Lead to Qualified, or update an existing Lead',
  defaultSubscription: 'type = "track" and event = "Lead Updated"',
  fields: {
    email: {
      label: 'Email',
      description: 'The email address of the lead to upsert.',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: 'The phone number of the lead to upsert.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    company: {
      label: 'Company',
      description: 'The company name of the lead to upsert.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.company' },
          then: { '@path': '$.context.traits.company' },
          else: { '@path': '$.properties.company' }
        }
      }
    },
    name: {
      label: 'Name',
      description: 'The name of the lead to upsert.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.name' },
          then: { '@path': '$.context.traits.name' },
          else: { '@path': '$.properties.name' }
        }
      }
    },
    string_fields: {
      label: 'String Fields',
      description: 'Additional string, text, picklist fields to set on the Lead.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true
    },
    boolean_fields: {
      label: 'Boolean Fields',
      description: 'Additional boolean / checkbox fields to set on the Lead.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true
    },
    number_fields: {
      label: 'Number Fields',
      description: 'Additional numeric / decimal fields to set on the Lead.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      dynamic: true
    }
  },
  dynamicFields: {
    string_fields: {
      __keys__: async (request: RequestClient) => {
        return await dynamicReadFields(request, ['string', 'picklist', 'text'])
      }
    },
    boolean_fields: {
      __keys__: async (request: RequestClient) => {
        return await dynamicReadFields(request, ['boolean'])
      }
    },
    number_fields: {
      __keys__: async (request: RequestClient) => {
        return await dynamicReadFields(request, ['decimal'])
      }
    }
  },
  perform: async (request, { payload }) => {
    const { email, phone, company, name, string_fields, boolean_fields, number_fields } = payload

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

    const json: LeadJSON = {
      email,
      fields: {
        ...(phone || phone === '' ? { phone } : {}),
        ...(company || company === '' ? { company } : {}),
        ...(name || name === '' ? { name } : {}),
        ...string_fields,
        ...boolean_fields,
        ...number_fields
      }
    }

    return request(base_url + 'leads', {
      method: 'post',
      json
    })
  }
}

export default action
