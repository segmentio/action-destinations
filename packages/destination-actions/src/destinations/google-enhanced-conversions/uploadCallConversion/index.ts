import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  convertTimestamp,
  formatCustomVariables,
  getCustomVariables,
  getUrlByVersion,
  handleGoogleErrors
} from '../functions'
import { PartialErrorResponse } from '../types'
import { ModifiedResponse } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upload Call Conversion',
  description: 'Upload an offline call conversion to the Google Ads API.',
  fields: {
    conversion_action: {
      label: 'Conversion Action ID',
      description:
        'The ID of the conversion action associated with this conversion. To find the Conversion Action ID, click on your conversion in Google Ads and get the value for `ctId` in the URL. For example, if the URL is `https://ads.google.com/aw/conversions/detail?ocid=00000000&ctId=570000000`, your Conversion Action ID is `570000000`.',
      type: 'number',
      required: true
    },
    caller_id: {
      label: 'Caller ID',
      description:
        'The caller ID from which this call was placed. Caller ID is expected to be in E.164 format with preceding + sign, e.g. "+16502531234".',
      type: 'string',
      required: true
    },
    call_timestamp: {
      label: 'Call Timestamp',
      description:
        'The date time at which the call occurred. The timezone must be specified. The format is "yyyy-mm-dd hh:mm:ss+|-hh:mm", e.g. "2019-01-01 12:32:45-08:00".',
      type: 'string',
      required: true
    },
    conversion_timestamp: {
      label: 'Conversion Timestamp',
      description:
        'The date time at which the conversion occurred. Must be after the click time. The timezone must be specified. The format is "yyyy-mm-dd hh:mm:ss+|-hh:mm", e.g. "2019-01-01 12:32:45-08:00".',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    value: {
      label: 'Value',
      description: 'The value of the conversion for the advertiser.',
      type: 'number',
      default: {
        '@path': '$.properties.total'
      }
    },
    currency: {
      label: 'Currency',
      description: 'Currency associated with the conversion value. This is the ISO 4217 3-character currency code.',
      type: 'string',
      default: {
        '@path': '$.properties.currency'
      }
    },
    custom_variables: {
      label: 'Custom Variables',
      description:
        'The custom variables associated with this conversion. On the left-hand side, input the name of the custom variable as it appears in your Google Ads account. On the right-hand side, map the Segment field that contains the corresponding value See [Google’s documentation on how to create custom conversion variables](https://developers.google.com/google-ads/api/docs/conversions/conversion-custom-variables).',
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: async (request, { auth, settings, payload, features, statsContext }) => {
    /* Enforcing this here since Customer ID is required for the Google Ads API
    but not for the Enhanced Conversions API. */
    if (!settings.customerId) {
      throw new IntegrationError(
        'Customer ID is required for this action. Please set it in destination settings.',
        'Missing required fields.',
        400
      )
    }

    settings.customerId = settings.customerId.replace(/-/g, '')

    const request_object: { [key: string]: any } = {
      conversionAction: `customers/${settings.customerId}/conversionActions/${payload.conversion_action}`,
      callerId: payload.caller_id,
      callStartDateTime: convertTimestamp(payload.call_timestamp),
      conversionDateTime: convertTimestamp(payload.conversion_timestamp),
      conversionValue: payload.value,
      currencyCode: payload.currency
    }

    // Retrieves all of the custom variables that the customer has created in their Google Ads account
    if (payload.custom_variables) {
      const customVariableIds = await getCustomVariables(settings.customerId, auth, request, features, statsContext)
      request_object.customVariables = formatCustomVariables(
        payload.custom_variables,
        customVariableIds.data[0].results
      )
    }
    const response: ModifiedResponse<PartialErrorResponse> = await request(
      `${getUrlByVersion(features, statsContext)}/${settings.customerId}:uploadCallConversions`,
      {
        method: 'post',
        headers: {
          'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
        },
        json: {
          conversions: [request_object],
          partialFailure: true
        }
      }
    )

    handleGoogleErrors(response)
    return response
  }
}

export default action
