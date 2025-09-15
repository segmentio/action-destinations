import type { ActionDefinition, ActionHookResponse } from '@segment/actions-core'
import { ErrorCodes, IntegrationError, PayloadValidationError, InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { LinkedInConversions } from '../api'
import { CONVERSION_TYPE_OPTIONS, SUPPORTED_LOOKBACK_WINDOW_CHOICES, DEPENDS_ON_CONVERSION_RULE_ID } from '../constants'
import type { Payload, OnMappingSaveInputs, OnMappingSaveOutputs } from './generated-types'
import { LinkedInError } from '../types'

const action: ActionDefinition<Settings, Payload, undefined, OnMappingSaveInputs, OnMappingSaveOutputs> = {
  title: 'Stream Conversion Event',
  description: 'Directly streams conversion events to a specific conversion rule.',
  defaultSubscription: 'type = "track"',
  hooks: {
    onMappingSave: {
      label: 'Create a Conversion Rule',
      description:
        'When saving this mapping, we will create a conversion rule in LinkedIn using the fields you provided.\n To configure: either provide an existing conversion rule ID or fill in the fields below to create a new conversion rule.',
      inputFields: {
        adAccountId: {
          label: 'Ad Account',
          description:
            'The ad account to use when creating the conversion event. (When updating a conversion rule after initially creating it, changes to this field will be ignored. LinkedIn does not allow Ad Account IDs to be updated for a conversion rule.)',
          type: 'string',
          required: true,
          dynamic: async (request) => {
            const linkedIn = new LinkedInConversions(request)
            return linkedIn.getAdAccounts()
          }
        },
        campaignId: {
          label: 'Add Campaigns to Conversion',
          description:
            'Select one or more advertising campaigns from your ad account to associate with the configured conversion rule. Segment will only add the selected campaigns to the conversion rule. Deselecting a campaign will not disassociate it from the conversion rule.',
          type: 'string',
          multiple: true,
          required: false,
          dynamic: async (request, { hookInputs }) => {
            const linkedIn = new LinkedInConversions(request)
            return linkedIn.getCampaignsList(hookInputs?.adAccountId)
          }
        },
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
          dynamic: async (request, { hookInputs }) => {
            const linkedIn = new LinkedInConversions(request)
            return linkedIn.getConversionRulesList(hookInputs?.adAccountId)
          }
        },
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the conversion rule.',
          depends_on: DEPENDS_ON_CONVERSION_RULE_ID
        },
        conversionType: {
          type: 'string',
          label: 'Conversion Type',
          description: 'The type of conversion rule.',
          choices: CONVERSION_TYPE_OPTIONS,
          depends_on: DEPENDS_ON_CONVERSION_RULE_ID
        },
        attribution_type: {
          label: 'Attribution Type',
          description: 'The attribution type for the conversion rule.',
          type: 'string',
          choices: [
            { label: 'Each Campaign', value: 'LAST_TOUCH_BY_CAMPAIGN' },
            { label: 'Single Campaign', value: 'LAST_TOUCH_BY_CONVERSION' }
          ],
          depends_on: DEPENDS_ON_CONVERSION_RULE_ID
        },
        post_click_attribution_window_size: {
          label: 'Post-Click Attribution Window Size',
          description:
            'Conversion window timeframe (in days) of a member clicking on a LinkedIn Ad (a post-click conversion) within which conversions will be attributed to a LinkedIn ad. Allowed values are 1, 7, 30 or 90. Default is 30.',
          type: 'number',
          default: 30,
          choices: SUPPORTED_LOOKBACK_WINDOW_CHOICES,
          depends_on: DEPENDS_ON_CONVERSION_RULE_ID
        },
        view_through_attribution_window_size: {
          label: 'View-Through Attribution Window Size',
          description:
            'Conversion window timeframe (in days) of a member seeing a LinkedIn Ad (a view-through conversion) within which conversions will be attributed to a LinkedIn ad. Allowed values are 1, 7, 30 or 90. Default is 7.',
          type: 'number',
          default: 7,
          choices: SUPPORTED_LOOKBACK_WINDOW_CHOICES,
          depends_on: DEPENDS_ON_CONVERSION_RULE_ID
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
        },
        attribution_type: {
          label: 'Attribution Type',
          description: 'The attribution type for the conversion rule.',
          type: 'string',
          required: true
        },
        post_click_attribution_window_size: {
          label: 'Post-Click Attribution Window Size',
          description:
            'Conversion window timeframe (in days) of a member clicking on a LinkedIn Ad (a post-click conversion) within which conversions will be attributed to a LinkedIn ad.',
          type: 'number',
          required: true
        },
        view_through_attribution_window_size: {
          label: 'View-Through Attribution Window Size',
          description:
            'Conversion window timeframe (in days) of a member seeing a LinkedIn Ad (a view-through conversion) within which conversions will be attributed to a LinkedIn ad. Allowed values are 1, 7, 30 or 90. Default is 7.',
          type: 'number',
          required: true
        }
      },
      performHook: async (request, { hookInputs, hookOutputs }) => {
        const linkedIn = new LinkedInConversions(request)

        let hookReturn: ActionHookResponse<OnMappingSaveOutputs>
        if (hookOutputs?.onMappingSave?.outputs) {
          linkedIn.setConversionRuleId(hookOutputs.onMappingSave.outputs.id)

          hookReturn = await linkedIn.updateConversionRule(
            hookInputs,
            hookOutputs.onMappingSave.outputs as OnMappingSaveOutputs
          )
        } else {
          hookReturn = await linkedIn.createConversionRule(hookInputs)
        }

        if (hookReturn.error || !hookReturn.savedData) {
          return hookReturn
        }
        linkedIn.setConversionRuleId(hookReturn.savedData.id)

        try {
          await linkedIn.bulkAssociateCampaignToConversion(hookInputs?.campaignId)
        } catch (error) {
          return {
            error: {
              message: `Failed to associate campaigns to conversion rule, please try again: ${JSON.stringify(error)}`,
              code: 'ASSOCIATE_CAMPAIGN_TO_CONVERSION_ERROR'
            }
          }
        }

        return hookReturn
      }
    }
  },
  fields: {
    conversionHappenedAt: {
      label: 'Timestamp',
      description:
        'Epoch timestamp in milliseconds at which the conversion event happened. If your source records conversion timestamps in second, insert 000 at the end to transform it to milliseconds.',
      type: 'string',
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
      defaultObjectUI: 'keyvalue:only',
      default: {
        currencyCode: { '@path': '$.properties.currency' },
        amount: { '@path': '$.properties.revenue' }
      },
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
      description: 'The unique id for each event. This field is optional and is used for deduplication.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.messageId'
      }
    },
    email: {
      label: 'Email',
      description:
        'Email address of the contact associated with the conversion event. Segment will hash this value before sending it to LinkedIn. One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.email' },
      category: 'hashedPII'
    },
    linkedInUUID: {
      label: 'LinkedIn First Party Ads Tracking UUID',
      description:
        'First party cookie or Click Id. Enhanced conversion tracking must be enabled to use this ID type. See [LinkedIn documentation](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/conversions-api?view=li-lms-2024-01&tabs=http#idtype) for more details. One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.',
      type: 'string',
      required: false
    },
    acxiomID: {
      label: 'Acxiom ID',
      description:
        'User identifier for matching with LiveRamp identity graph. One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.',
      type: 'string',
      required: false
    },
    oracleID: {
      label: 'Oracle ID',
      description:
        'User identifier for matching with Oracle MOAT Identity. Also known as ORACLE_MOAT_ID in LinkedIn documentation. One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.',
      type: 'string',
      required: false
    },
    userInfo: {
      label: 'User Info',
      description:
        'Object containing additional fields for user matching. If this object is defined, both firstName and lastName are required.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: false,
      properties: {
        firstName: {
          label: 'First Name',
          type: 'string',
          required: true
        },
        lastName: {
          label: 'Last Name',
          type: 'string',
          required: true
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
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 5000,
      unsafe_hidden: true
    }
  },
  perform: async (request, { payload, hookOutputs }) => {
    const conversionTime = isNotEpochTimestampInMilliseconds(payload.conversionHappenedAt)
      ? convertToEpochMillis(payload.conversionHappenedAt)
      : Number(payload.conversionHappenedAt)
    validate(payload, conversionTime)

    let conversionRuleId = ''
    if (hookOutputs?.onMappingSave?.outputs?.id) {
      conversionRuleId = hookOutputs?.onMappingSave.outputs?.id
    }

    if (!conversionRuleId) {
      throw new PayloadValidationError('Conversion Rule ID is required.')
    }

    const linkedinApiClient: LinkedInConversions = new LinkedInConversions(request)
    linkedinApiClient.setConversionRuleId(conversionRuleId)

    try {
      return linkedinApiClient.streamConversionEvent(payload, conversionTime)
    } catch (error) {
      throw handleRequestError(error)
    }
  },
  performBatch: async (request, { payload: payloads, hookOutputs }) => {
    const linkedinApiClient: LinkedInConversions = new LinkedInConversions(request)
    const conversionRuleId = hookOutputs?.onMappingSave?.outputs?.id

    if (!conversionRuleId) {
      throw new PayloadValidationError('Conversion Rule ID is required.')
    }

    linkedinApiClient.setConversionRuleId(conversionRuleId)

    try {
      return linkedinApiClient.batchConversionAdd(payloads)
    } catch (error) {
      throw handleRequestError(error)
    }
  }
}

function handleRequestError(error: unknown) {
  const asLinkedInError = error as LinkedInError

  if (!asLinkedInError) {
    return new IntegrationError('Unknown error', 'UNKNOWN_ERROR', 500)
  }

  const status = asLinkedInError.response.data.status

  if (status === 401) {
    return new InvalidAuthenticationError(asLinkedInError.response.data.message, ErrorCodes.INVALID_AUTHENTICATION)
  }

  if (status === 501) {
    return new IntegrationError(asLinkedInError.response.data.message, 'INTEGRATION_ERROR', 501)
  }

  if (status === 408 || status === 423 || status === 429 || status >= 500) {
    return new IntegrationError(asLinkedInError.response.data.message, 'RETRYABLE_ERROR', status)
  }

  return new IntegrationError(asLinkedInError.response.data.message, 'INTEGRATION_ERROR', status)
}

function validate(payload: Payload, conversionTime: number) {
  // Check if the timestamp is within the past 90 days
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  if (conversionTime < ninetyDaysAgo) {
    throw new PayloadValidationError('Timestamp should be within the past 90 days.')
  }

  if (!payload.email && !payload.linkedInUUID && !payload.acxiomID && !payload.oracleID) {
    throw new PayloadValidationError('One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.')
  }
}

function isNotEpochTimestampInMilliseconds(timestamp: string) {
  if (typeof timestamp === 'string' && !isNaN(Number(timestamp))) {
    const convertedTimestamp = Number(timestamp)
    const startDate = new Date('1970-01-01T00:00:00Z').getTime()
    const endDate = new Date('2100-01-01T00:00:00Z').getTime()
    if (Number.isSafeInteger(convertedTimestamp) && convertedTimestamp >= startDate && convertedTimestamp <= endDate) {
      return false
    }
  }
  return true
}

function convertToEpochMillis(timestamp: string) {
  const date = new Date(timestamp)
  return date.getTime()
}

export default action
