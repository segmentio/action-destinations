import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatCustomVariables, verifyCurrency } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upload Call Conversion',
  description: 'Upload an offline call conversion to the Google Ads API.',
  fields: {
    conversion_action: {
      label: 'Conversion Action ID',
      description:
        'The ID of the conversion action associated with this conversion. To find the Conversion Action ID, click on your conversion in Google Ads and get the value for ctId in the URL. For example, if the URL is https://ads.google.com/aw/conversions/detail?ocid=00000000&ctId=570000000, your Conversion Action ID is 570000000.',
      type: 'string',
      required: true,
      default: ''
    },
    caller_id: {
      label: 'Caller ID',
      description:
        'The caller id from which this call was placed. Caller id is expected to be in E.164 format with preceding + sign. e.g. "+16502531234".',
      type: 'string',
      required: true,
      default: ''
    },
    call_timestamp: {
      label: 'Call Timestamp',
      description:
        'The date time at which the call occurred. The timezone must be specified. The format is "yyyy-mm-dd hh:mm:ss+|-hh:mm", e.g. "2019-01-01 12:32:45-08:00".',
      type: 'string'
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
        'The custom variables associated with this conversion. See Google’s documentation on how to create custom conversion variables.',
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue'
    }
  },
  perform: async (request, { settings, payload }) => {
    if (!settings.customerId) {
      throw new IntegrationError(
        'Customer id is required for this action. Please set it in destination settings.',
        'Missing required fields.',
        400
      )
    }

    settings.customerId = settings.customerId.replace(/[^0-9.]+/g, '')

    if (payload.currency) {
      verifyCurrency(payload.currency)
    }

    const request_object: { [key: string]: any } = {
      conversionAction: `customers/${settings.customerId}/conversionActions/${payload.conversion_action}`,
      callerId: payload.caller_id,
      callStartDateTime: payload.call_timestamp,
      conversionDateTime: payload.conversion_timestamp.replace(/T/, ' ').replace(/\..+/, '+00:00'),
      conversionValue: payload.value,
      currencyCode: payload.currency,
      customVariables: formatCustomVariables(payload.custom_variables, settings.customerId)
    }

    const response = await request(
      `https://googleads.googleapis.com/v11/customers/${settings.customerId}:uploadCallConversions`,
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

    // Catch and return partial failure error
    if (typeof response.data === 'object' && response.data != null) {
      Object.entries(response.data).forEach(([key, value]) => {
        if (key === 'partialFailureError' && value.code !== 0) {
          throw new IntegrationError(value.message, 'INVALID_ARGUMENT', 400)
        }
      })
    }
    return response
  }
}

export default action
