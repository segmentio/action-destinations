import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Stream Conversion Event',
  description: 'Directly streams conversion events to a specific conversion rule.',
  fields: {},
  hooks: {
    'on-subscription-save': {
      label: 'Create a Conversion Rule',
      description: 'When saving this mapping, we will create a conversion rule in LinkedIn using the fields you provided.',
      inputFields: {
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the conversion rule.',
          required: true
        },
        conversionType: {
          type: 'string',
          label: 'Conversion Type',
          description: 'The type of conversion rule.',
          required: true
        },
        account: {
          type: 'string',
          label: 'Account',
          description: 'The account to associate this conversion rule with.',
          required: true,
        },
        attribution_type: {
          label: 'Attribution Type',
          description: 'The attribution type for the conversion rule.',
          type: 'string',
          required: true,
        }
      },
      outputTypes: {
        id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the conversion rule.',
          required: true
        },
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the conversion rule.',
          required: true
        },
        conversionType: {
          type: 'string',
          label: 'Conversion Type',
          description: 'The type of conversion rule.',
          required: true
        }
      },
      performHook: async (request, { settings, payload, inputValues }) => {
        const res = await request('https://api.linkedin.com/rest/conversions', {
          method: 'post',
          json: {
            name: inputValues.name,
            account: inputValues.account,
            conversionMethod: 'CONVERSIONS_API',
            postClickAttributionWindowSize: 30,
            viewThroughAttributionWindowSize: 7,
            attributionType: inputValues.attribution_type,
            type: inputValues.conversionType
          }
        })

        return {
          id: res.id,
          name: res.name,
          conversionType: res.type
        }
      }
    }
  },
  perform: (request, data) => {
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
