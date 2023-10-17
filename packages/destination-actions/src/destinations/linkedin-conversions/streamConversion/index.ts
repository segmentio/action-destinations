import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload, SubscriptionSaveInputs, SubscriptionSaveOutputs } from './generated-types'

interface ConversionRuleCreationResponse {
  id: string
  name: string
  type: string
}

const action: ActionDefinition<Settings, Payload, undefined, SubscriptionSaveOutputs, SubscriptionSaveInputs> = {
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
      performHook: async (request, { hookInputs }) => {
        if (!hookInputs) {
          throw new Error('No hook inputs provided')
        }

        const { data } = await request<ConversionRuleCreationResponse>('https://api.linkedin.com/rest/conversions', {
          method: 'post',
          json: {
            name: hookInputs.name,
            account: hookInputs.account,
            conversionMethod: 'CONVERSIONS_API',
            postClickAttributionWindowSize: 30,
            viewThroughAttributionWindowSize: 7,
            attributionType: hookInputs.attribution_type,
            type: hookInputs.conversionType
          }
        })

        return {
          successMessage: `Conversion rule ${data.id} created successfully!`,
          savedData: {
            id: data.id,
            name: data.name,
            conversionType: data.type
          }
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
