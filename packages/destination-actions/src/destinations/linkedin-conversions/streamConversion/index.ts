import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { LinkedInConversions } from '../api'
import { SUPPORTED_ID_TYPE } from '../constants'
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
  defaultSubscription: 'type = "track"',
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
          required: false,
          dynamic: async (request, { payload }) => {
            const linkedIn = new LinkedInConversions(request)
            return linkedIn.getConversionRulesList(payload.adAccountId)
          }
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
  fields: {
    adAccountId: {
      label: 'Ad Account',
      description: 'A dynamic field dropdown which fetches all adAccounts.',
      type: 'string',
      required: true,
      dynamic: true
    },
    conversionHappenedAt: {
      label: 'Timestamp',
      description:
        'Epoch timestamp in milliseconds at which the conversion event happened. If your source records conversion timestamps in second, insert 000 at the end to transform it to milliseconds.',
      type: 'integer',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    conversionValue: {
      label: 'Conversion Value',
      description: 'The monetary value for this conversion. Example: {“currencyCode”: “USD”, “amount”: “50.0”}.',
      type: 'object',
      required: false,
      properties: {
        currencyCode: {
          label: 'Currency Code',
          type: 'string',
          required: true,
          description: 'ISO format'
        },
        amount: {
          label: 'Amount',
          type: 'string',
          required: true,
          description: 'Value of the conversion in decimal string. Can be dynamically set up or have a fixed value.'
        }
      }
    },
    eventId: {
      label: 'Event ID',
      description: 'Will be used for deduplication in future.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.messageId'
      }
    },
    userIds: {
      label: 'User Ids',
      description:
        'Either userIds or userInfo is required. List of one or more identifiers to match the conversion user with objects containing "idType" and "idValue".',
      type: 'object',
      multiple: true,
      properties: {
        idType: {
          label: 'ID Type',
          description: `Valid values are: ${SUPPORTED_ID_TYPE.join(', ')}`,
          type: 'string',
          required: true
        },
        idValue: {
          label: 'ID Value',
          description: 'The value of the identifier.',
          type: 'string',
          required: true
        }
      }
    },
    userInfo: {
      label: 'User Info',
      description: 'Object containing additional fields for user matching.',
      type: 'object',
      required: false,
      properties: {
        firstName: {
          label: 'First Name',
          type: 'string',
          required: false
        },
        lastName: {
          label: 'Last Name',
          type: 'string',
          required: false
        },
        companyName: {
          label: 'Company Name',
          type: 'string',
          required: false
        },
        title: {
          label: 'Title',
          type: 'string',
          required: false
        },
        countryCode: {
          label: 'Country Code',
          type: 'string',
          required: false
        }
      }
    },
    campaignId: {
      label: 'Campaign',
      type: 'string',
      required: true,
      dynamic: true,
      description: 'A dynamic field dropdown which fetches all active campaigns.'
    }
  },
  dynamicFields: {
    adAccountId: async (request) => {
      const linkedIn = new LinkedInConversions(request)
      return linkedIn.getAdAccounts()
    },
    campaignId: async (request, { payload }) => {
      const linkedIn = new LinkedInConversions(request)
      return linkedIn.getCampaignsList(payload.adAccountId)
    }
  },
  perform: async (request, { payload, hookOutputs }) => {
    validate(payload)

    let conversionRuleId = ''
    if (hookOutputs?.onMappingSave?.outputs?.id) {
      conversionRuleId = hookOutputs?.onMappingSave.outputs?.id
    }

    if (!conversionRuleId) {
      throw new PayloadValidationError('Conversion Rule ID is required.')
    }

    const linkedinApiClient: LinkedInConversions = new LinkedInConversions(request, conversionRuleId)
    try {
      await linkedinApiClient.associateCampignToConversion(payload)
      return linkedinApiClient.streamConversionEvent(payload)
    } catch (error) {
      return error
    }
  }
}

function validate(payload: Payload) {
  const dateFromTimestamp = new Date(payload.conversionHappenedAt)
  if (isNaN(dateFromTimestamp.getTime())) {
    throw new PayloadValidationError('Timestamp field should be valid timestamp.')
  }

  // Check if the timestamp is within the past 90 days
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  if (payload.conversionHappenedAt < ninetyDaysAgo) {
    throw new PayloadValidationError('Timestamp should be within the past 90 days.')
  }

  if (
    payload.userIds &&
    Array.isArray(payload.userIds) &&
    payload.userIds?.length === 0 &&
    (!payload.userInfo || !(payload.userInfo.firstName && payload.userInfo.lastName))
  ) {
    throw new PayloadValidationError('Either userIds array or userInfo with firstName and lastName should be present.')
  } else if (payload.userIds && payload.userIds.length !== 0) {
    const isValidUserIds = payload.userIds.every((obj) => {
      return SUPPORTED_ID_TYPE.includes(obj.idType)
    })

    if (!isValidUserIds) {
      throw new PayloadValidationError(`Invalid idType in userIds field. Allowed idType will be: ${SUPPORTED_ID_TYPE}`)
    }
  }
}

export default action
