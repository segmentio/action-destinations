import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload, HookBundle } from './generated-types'

interface ConversionRuleCreationResponse {
  id: string
  name: string
  type: string
}

interface LinkedInError {
  message: string
}

const action: ActionDefinition<Settings, Payload, undefined, HookBundle> = {
  title: 'Stream Conversion Event',
  description: 'Directly streams conversion events to a specific conversion rule.',
  fields: {
    adAccountId: {
      label: 'Ad Account',
      description: 'A dynamic field dropdown which fetches all adAccounts.',
      type: 'string',
      required: true,
      dynamic: true
    }
  },
  hooks: {
    onMappingSave: {
      label: 'Create a Conversion Rule',
      description:
        'When saving this mapping, we will create a conversion rule in LinkedIn using the fields you provided.',
      inputFields: {
        /**
         * The configuration fields for a LinkedIn CAPI conversion rule.
         * Detailed information on these parameters can be found at
         * https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/conversion-tracking?view=li-lms-2023-07&tabs=https#create-a-conversion
         */
        conversionRuleId: {
          type: 'string',
          label: 'Existing Conversion Rule ID',
          description:
            'The ID of an existing conversion rule to stream events to. If defined, we will not create a new conversion rule.',
          required: false
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
          required: true,
          choices: [
            { label: 'Add to Cart', value: 'ADD_TO_CART' },
            { label: 'Download', value: 'DOWNLOAD' },
            { label: 'Install', value: 'INSTALL' },
            { label: 'Key Page View', value: 'KEY_PAGE_VIEW' },
            { label: 'Lead', value: 'LEAD' },
            { label: 'Purchase', value: 'PURCHASE' },
            { label: 'Sign Up', value: 'SIGN_UP' },
            { label: 'Other', value: 'OTHER' }
          ]
        },
        attribution_type: {
          label: 'Attribution Type',
          description: 'The attribution type for the conversion rule.',
          type: 'string',
          required: true,
          choices: [
            { label: 'Each Campaign', value: 'LAST_TOUCH_BY_CAMPAIGN' },
            { label: 'Single Campaign', value: 'LAST_TOUCH_BY_CONVERSION' }
          ]
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
      performHook: async (request, { payload, hookInputs }) => {
        if (hookInputs?.conversionRuleId) {
          return {
            successMessage: `Using existing Conversion Rule: ${hookInputs.conversionRuleId} `,
            savedData: {
              id: hookInputs.conversionRuleId,
              name: hookInputs.name,
              conversionType: hookInputs.conversionType
            }
          }
        }

        try {
          const { data } = await request<ConversionRuleCreationResponse>('https://api.linkedin.com/rest/conversions', {
            method: 'post',
            json: {
              name: hookInputs?.name,
              account: payload?.adAccountId,
              conversionMethod: 'CONVERSIONS_API',
              postClickAttributionWindowSize: 30,
              viewThroughAttributionWindowSize: 7,
              attributionType: hookInputs?.attribution_type,
              type: hookInputs?.conversionType
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
        } catch (e) {
          return {
            errorMessage: `Failed to create conversion rule: ${(e as LinkedInError)?.message ?? JSON.stringify(e)}`
          }
        }
      }
    }
  },
  perform: (request, data) => {
    return request('https://example.com', {
      method: 'post',
      json: {
        conversion: data.hookOutputs?.onMappingSave?.id
      }
    })
  }
}

export default action
