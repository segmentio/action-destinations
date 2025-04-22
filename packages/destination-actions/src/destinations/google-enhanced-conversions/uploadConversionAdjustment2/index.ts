import {
  ActionDefinition,
  DynamicFieldResponse,
  IntegrationError,
  PayloadValidationError,
  RequestClient
} from '@segment/actions-core'
import {
  handleGoogleErrors,
  convertTimestamp,
  getApiVersion,
  commonEmailValidation,
  getConversionActionDynamicData,
  formatPhone
} from '../functions'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PartialErrorResponse, ConversionAdjustmentRequestObjectInterface, UserIdentifierInterface } from '../types'
import { ModifiedResponse } from '@segment/actions-core'
import { GOOGLE_ENHANCED_CONVERSIONS_BATCH_SIZE } from '../constants'
import { processHashing } from '../../../lib/hashing-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Adjustment V2',
  description: 'Send a conversion adjustment to the Google Ads API.',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'add',
    choices: [{ label: 'Insert Records', value: 'add' }]
  },
  fields: {
    conversion_action: {
      label: 'Conversion Action ID',
      description: 'The ID of the conversion action associated with this conversion.',
      type: 'number',
      required: true,
      dynamic: true
    },
    adjustment_type: {
      label: 'Adjustment Type',
      description:
        'The adjustment type. See [Google’s documentation](https://developers.google.com/google-ads/api/reference/rpc/v11/ConversionAdjustmentTypeEnum.ConversionAdjustmentType) for details on each type.',
      type: 'string',
      choices: [
        { label: `UNSPECIFIED`, value: 'UNSPECIFIED' },
        { label: `UNKNOWN`, value: 'UNKNOWN' },
        { label: `RETRACTION`, value: 'RETRACTION' },
        { label: 'RESTATEMENT', value: 'RESTATEMENT' },
        { label: `ENHANCEMENT`, value: 'ENHANCEMENT' }
      ],
      required: true
    },
    adjustment_timestamp: {
      label: 'Adjustment Timestamp',
      description:
        'The date time at which the adjustment occurred. Must be after the conversion timestamp. The timezone must be specified. The format is "yyyy-mm-dd hh:mm:ss+|-hh:mm", e.g. "2019-01-01 12:32:45-08:00". If no timestamp is provided, Segment will fall back on the current time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    order_id: {
      label: 'Order ID',
      description:
        'The order ID of the conversion to be adjusted. If the conversion was reported with an order ID specified, that order ID must be used as the identifier here.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.orderId' },
          then: { '@path': '$.properties.orderId' },
          else: { '@path': '$.properties.order_id' }
        }
      }
    },
    gclid: {
      label: 'GCLID',
      description:
        'Google click ID associated with the original conversion for this adjustment. This is used for the GCLID Date Time Pair.',
      type: 'string'
    },
    conversion_timestamp: {
      label: 'Conversion Timestamp',
      description:
        'The date time at which the original conversion for this adjustment occurred. The timezone must be specified. The format is "yyyy-mm-dd hh:mm:ss+|-hh:mm", e.g. "2019-01-01 12:32:45-08:00". This is used for the GCLID Date Time Pair.',
      type: 'string'
    },
    restatement_value: {
      label: 'Restatement Value',
      description:
        'The restated conversion value. This is the value of the conversion after restatement. For example, to change the value of a conversion from 100 to 70, an adjusted value of 70 should be reported. Required for RESTATEMENT adjustments.',
      type: 'number',
      depends_on: {
        conditions: [
          {
            fieldKey: 'adjustment_type',
            operator: 'is_not',
            value: ['RETRACTION']
          }
        ]
      }
    },
    restatement_currency_code: {
      label: 'Restatement Currency Code',
      description:
        'The currency of the restated value. If not provided, then the default currency from the conversion action is used, and if that is not set then the account currency is used. This is the ISO 4217 3-character currency code, e.g. USD or EUR.',
      type: 'string',
      depends_on: {
        conditions: [
          {
            fieldKey: 'adjustment_type',
            operator: 'is_not',
            value: ['RETRACTION']
          }
        ]
      }
    },
    phone_country_code: {
      label: 'Phone Number Country Code',
      description: `The numeric country code to associate with the phone number. If not provided Segment will default to '+1'. If the country code does not start with '+' Segment will add it.`,
      type: 'string'
    },
    email_address: {
      label: 'Email Address',
      description: 'Email address of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      },
      category: 'hashedPII'
    },
    phone_number: {
      label: 'Phone Number',
      description:
        'Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.phone' },
          then: { '@path': '$.properties.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      },
      category: 'hashedPII'
    },
    first_name: {
      label: 'First Name',
      description: 'First name of the user who performed the conversion.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.firstName' },
          then: { '@path': '$.properties.firstName' },
          else: { '@path': '$.context.traits.firstName' }
        }
      }
    },
    last_name: {
      label: 'Last Name',
      description: 'Last name of the user who performed the conversion.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.lastName' },
          then: { '@path': '$.properties.lastName' },
          else: { '@path': '$.context.traits.lastName' }
        }
      },
      category: 'hashedPII'
    },
    city: {
      label: 'City',
      description: 'City of the user who performed the conversion.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.city,' },
          then: { '@path': '$.properties.address.city,' },
          else: { '@path': '$.context.traits.address.city' }
        }
      }
    },
    state: {
      label: 'State',
      description: 'State of the user who performed the conversion.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.state,' },
          then: { '@path': '$.properties.address.state,' },
          else: { '@path': '$.context.traits.address.state' }
        }
      }
    },
    country: {
      label: 'Country',
      description: '2-letter country code in ISO-3166-1 alpha-2 of the user who performed the conversion.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.country,' },
          then: { '@path': '$.properties.address.country,' },
          else: { '@path': '$.context.traits.address.country' }
        }
      }
    },
    postal_code: {
      label: 'Postal Code',
      description: 'Postal code of the user who performed the conversion.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.postalCode,' },
          then: { '@path': '$.properties.address.postalCode,' },
          else: { '@path': '$.context.traits.address.postalCode' }
        }
      }
    },
    street_address: {
      label: 'Street Address',
      description: 'Street address of the user who performed the conversion.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.street,' },
          then: { '@path': '$.properties.address.street,' },
          else: { '@path': '$.context.traits.address.street' }
        }
      },
      category: 'hashedPII'
    },
    user_agent: {
      label: 'User Agent',
      description:
        'The user agent to enhance the original conversion. User agent can only be specified in enhancements with user identifiers. This should match the user agent of the request that sent the original conversion so the conversion and its enhancement are either both attributed as same-device or both attributed as cross-device.',
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Google Enhanced Conversions',
      description:
        'If true, Segment will batch events before sending to Google’s APIs. Google accepts batches of up to 2000 events.',
      unsafe_hidden: true,
      default: false
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch.',
      type: 'number',
      unsafe_hidden: true,
      default: GOOGLE_ENHANCED_CONVERSIONS_BATCH_SIZE
    }
  },
  dynamicFields: {
    conversion_action: async (
      request: RequestClient,
      { settings, auth, features, statsContext }
    ): Promise<DynamicFieldResponse> => {
      return getConversionActionDynamicData(request, settings, auth, features, statsContext)
    }
  },
  perform: async (request, { settings, payload, features, statsContext, syncMode }) => {
    if (syncMode === 'add') {
      /* Enforcing this here since Customer ID is required for the Google Ads API
      but not for the Enhanced Conversions API. */
      if (!settings.customerId) {
        throw new PayloadValidationError(
          'Customer ID is required for this action. Please set it in destination settings.'
        )
      }

      settings.customerId = settings.customerId.replace(/-/g, '')

      if (!payload.adjustment_timestamp) {
        payload.adjustment_timestamp = new Date().toISOString()
      }

      const request_object: ConversionAdjustmentRequestObjectInterface = {
        conversionAction: `customers/${settings.customerId}/conversionActions/${payload.conversion_action}`,
        adjustmentType: payload.adjustment_type,
        adjustmentDateTime: convertTimestamp(payload.adjustment_timestamp),
        orderId: payload.order_id,
        gclidDateTimePair: {
          gclid: payload.gclid,
          conversionDateTime: convertTimestamp(payload.conversion_timestamp)
        },
        userIdentifiers: [],
        userAgent: payload.user_agent
      }

      // Google will return an error if this value is sent with retractions.
      if (payload.adjustment_type !== 'RETRACTION') {
        request_object.restatementValue = {
          adjustedValue: payload.restatement_value,
          currencyCode: payload.restatement_currency_code
        }
      }

      if (payload.email_address) {
        const validatedEmail: string = processHashing(payload.email_address, 'sha256', 'hex', commonEmailValidation)

        request_object.userIdentifiers.push({
          hashedEmail: validatedEmail
        } as UserIdentifierInterface)
      }

      if (payload.phone_number) {
        request_object.userIdentifiers.push({
          hashedPhoneNumber: processHashing(payload.phone_number, 'sha256', 'hex', (value) =>
            formatPhone(value, payload.phone_country_code)
          )
        } as UserIdentifierInterface)
      }

      const containsAddressInfo =
        payload.first_name ||
        payload.last_name ||
        payload.city ||
        payload.state ||
        payload.country ||
        payload.postal_code ||
        payload.street_address

      if (containsAddressInfo) {
        const addressInfo: any = {}
        if (payload.first_name) {
          addressInfo.hashedFirstName = processHashing(payload.first_name, 'sha256', 'hex')
        }
        if (payload.last_name) {
          addressInfo.hashedLastName = processHashing(payload.last_name, 'sha256', 'hex')
        }
        if (payload.street_address) {
          addressInfo.hashedStreetAddress = processHashing(payload.street_address, 'sha256', 'hex')
        }
        addressInfo.city = payload.city
        addressInfo.state = payload.state
        addressInfo.countryCode = payload.country
        addressInfo.postalCode = payload.postal_code

        request_object.userIdentifiers.push({
          addressInfo
        })
      }

      const response: ModifiedResponse<PartialErrorResponse> = await request(
        `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/customers/${
          settings.customerId
        }:uploadConversionAdjustments`,
        {
          method: 'post',
          headers: {
            'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
          },
          json: {
            conversionAdjustments: [request_object],
            partialFailure: true
          }
        }
      )

      handleGoogleErrors(response)
      return response
    } else {
      throw new IntegrationError(`Unsupported Sync Mode "${syncMode}"`, 'INTEGRATION_ERROR', 400)
    }
  },
  performBatch: async (request, { settings, payload, features, statsContext, syncMode }) => {
    if (syncMode !== 'add') {
      throw new IntegrationError(`Unsupported Sync Mode "${syncMode}"`, 'INTEGRATION_ERROR', 400)
    }

    /* Enforcing this here since Customer ID is required for the Google Ads API
      but not for the Enhanced Conversions API. */
    if (!settings.customerId) {
      throw new PayloadValidationError(
        'Customer ID is required for this action. Please set it in destination settings.'
      )
    }

    const customerId = settings.customerId.replace(/-/g, '')

    const request_objects: ConversionAdjustmentRequestObjectInterface[] = payload.map((payloadItem) => {
      if (!payloadItem.adjustment_timestamp) {
        payloadItem.adjustment_timestamp = new Date().toISOString()
      }

      const request_object: ConversionAdjustmentRequestObjectInterface = {
        conversionAction: `customers/${settings.customerId}/conversionActions/${payloadItem.conversion_action}`,
        adjustmentType: payloadItem.adjustment_type,
        adjustmentDateTime: convertTimestamp(payloadItem.adjustment_timestamp),
        orderId: payloadItem.order_id,
        gclidDateTimePair: {
          gclid: payloadItem.gclid,
          conversionDateTime: convertTimestamp(payloadItem.conversion_timestamp)
        },
        userIdentifiers: [],
        userAgent: payloadItem.user_agent
      }

      // Google will return an error if this value is sent with retractions.
      if (payloadItem.adjustment_type !== 'RETRACTION') {
        request_object.restatementValue = {
          adjustedValue: payloadItem.restatement_value,
          currencyCode: payloadItem.restatement_currency_code
        }
      }

      if (payloadItem.email_address) {
        const validatedEmail: string = processHashing(payloadItem.email_address, 'sha256', 'hex', commonEmailValidation)

        request_object.userIdentifiers.push({
          hashedEmail: validatedEmail
        } as UserIdentifierInterface)
      }

      if (payloadItem.phone_number) {
        request_object.userIdentifiers.push({
          hashedPhoneNumber: processHashing(payloadItem.phone_number, 'sha256', 'hex', (value) =>
            formatPhone(value, payloadItem.phone_country_code)
          )
        } as UserIdentifierInterface)
      }

      const containsAddressInfo =
        payloadItem.first_name ||
        payloadItem.last_name ||
        payloadItem.city ||
        payloadItem.state ||
        payloadItem.country ||
        payloadItem.postal_code ||
        payloadItem.street_address

      if (containsAddressInfo) {
        const addressInfo: any = {}
        if (payloadItem.first_name) {
          addressInfo.hashedFirstName = processHashing(payloadItem.first_name, 'sha256', 'hex')
        }
        if (payloadItem.last_name) {
          addressInfo.hashedLastName = processHashing(payloadItem.last_name, 'sha256', 'hex')
        }
        if (payloadItem.street_address) {
          addressInfo.hashedStreetAddress = processHashing(payloadItem.street_address, 'sha256', 'hex')
        }
        addressInfo.city = payloadItem.city
        addressInfo.state = payloadItem.state
        addressInfo.countryCode = payloadItem.country
        addressInfo.postalCode = payloadItem.postal_code

        request_object.userIdentifiers.push({
          addressInfo
        })
      }

      return request_object
    })

    const response: ModifiedResponse<PartialErrorResponse> = await request(
      `https://googleads.googleapis.com/${getApiVersion(
        features,
        statsContext
      )}/customers/${customerId}:uploadConversionAdjustments`,
      {
        method: 'post',
        headers: {
          'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
        },
        json: {
          conversionAdjustments: request_objects,
          partialFailure: true
        }
      }
    )

    handleGoogleErrors(response)
    return response
  }
}

export default action
