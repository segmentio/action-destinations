import {
  ActionDefinition,
  PayloadValidationError,
  ModifiedResponse,
  RequestClient,
  DynamicFieldResponse,
  IntegrationError
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  CartItemInterface,
  PartialErrorResponse,
  ClickConversionRequestObjectInterface,
  UserIdentifierInterface
} from '../types'
import {
  formatCustomVariables,
  hash,
  getCustomVariables,
  handleGoogleErrors,
  convertTimestamp,
  getApiVersion,
  commonHashedEmailValidation,
  getConversionActionDynamicData,
  isHashedInformation,
  memoizedGetCustomVariables
} from '../functions'
import { GOOGLE_ENHANCED_CONVERSIONS_BATCH_SIZE } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Click Conversion',
  description: 'Send an offline click conversion to the Google Ads API.',
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
    gclid: {
      label: 'GCLID',
      description: 'The Google click ID (gclid) associated with this conversion.',
      type: 'string'
    },
    gbraid: {
      label: 'GBRAID',
      description:
        'The click identifier for clicks associated with app conversions and originating from iOS devices starting with iOS14.',
      type: 'string'
    },
    wbraid: {
      label: 'WBRAID',
      description:
        'The click identifier for clicks associated with web conversions and originating from iOS devices starting with iOS14.',
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
    email_address: {
      label: 'Email Address',
      description:
        'Email address of the individual who triggered the conversion event. Segment will hash this value before sending to Google.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    phone_number: {
      label: 'Phone Number',
      description:
        'Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000. Segment will hash this value before sending to Google.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.phone' },
          then: { '@path': '$.properties.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      }
    },
    order_id: {
      label: 'Order ID',
      description:
        'The order ID associated with the conversion. An order ID can only be used for one conversion per conversion action.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.orderId' },
          then: { '@path': '$.properties.orderId' },
          else: { '@path': '$.properties.order_id' }
        }
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
    conversion_environment: {
      label: 'Conversion Environment',
      description:
        'The environment this conversion was recorded on, e.g. APP or WEB. Sending the environment field requires an allowlist in your Google Ads account. Leave this field blank if your account has not been allowlisted.',
      type: 'string',
      choices: [
        { label: 'APP', value: 'APP' },
        { label: 'WEB', value: 'WEB' },
        { label: 'UNSPECIFIED', value: 'UNSPECIFIED' }
      ]
    },
    merchant_id: {
      label: 'Merchant Center ID',
      description: 'The ID of the Merchant Center account where the items are uploaded.',
      type: 'string'
    },
    merchant_country_code: {
      label: 'Merchant Center Feed Country Code',
      description: 'The ISO 3166 two-character region code of the Merchant Center feed where the items are uploaded.',
      type: 'string'
    },
    merchant_language_code: {
      label: 'Merchant Center Feed Language Code',
      description: 'The ISO 639-1 language code of the Merchant Center feed where the items are uploaded.',
      type: 'string'
    },
    local_cost: {
      label: 'Local Transaction Cost',
      description:
        'Sum of all transaction-level discounts, such as free shipping and coupon discounts for the whole cart.',
      type: 'number'
    },
    items: {
      label: 'Items',
      description: 'Data of the items purchased.',
      type: 'object',
      multiple: true,
      properties: {
        product_id: {
          label: 'Product ID',
          type: 'string',
          description: 'The ID of the item sold.'
        },
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Number of items sold.'
        },
        price: {
          label: 'Price',
          type: 'number',
          description: 'Unit price excluding tax, shipping, and any transaction level discounts.'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            product_id: {
              '@path': '$.product_id'
            },
            quantity: {
              '@path': '$.quantity'
            },
            price: {
              '@path': '$.price'
            }
          }
        ]
      }
    },
    custom_variables: {
      label: 'Custom Variables',
      description:
        'The custom variables associated with this conversion. On the left-hand side, input the name of the custom variable as it appears in your Google Ads account. On the right-hand side, map the Segment field that contains the corresponding value See [Google’s documentation on how to create custom conversion variables.](https://developers.google.com/google-ads/api/docs/conversions/conversion-custom-variables) ',
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue:only'
    },
    ad_user_data_consent_state: {
      label: 'Ad User Data Consent State',
      description:
        'This represents consent for ad user data.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v15/Consent).',
      type: 'string',
      choices: [
        { label: 'GRANTED', value: 'GRANTED' },
        { label: 'DENIED', value: 'DENIED' },
        { label: 'UNSPECIFIED', value: 'UNSPECIFIED' }
      ]
    },
    ad_personalization_consent_state: {
      label: 'Ad Personalization Consent State',
      type: 'string',
      description:
        'This represents consent for ad personalization. This can only be set for OfflineUserDataJobService and UserDataService.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v15/Consent).',
      choices: [
        { label: 'GRANTED', value: 'GRANTED' },
        { label: 'DENIED', value: 'DENIED' },
        { label: 'UNSPECIFIED', value: 'UNSPECIFIED' }
      ]
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
  perform: async (request, { auth, settings, payload, features, statsContext, syncMode }) => {
    if (syncMode === 'add') {
      /* Enforcing this here since Customer ID is required for the Google Ads API
      but not for the Enhanced Conversions API. */
      if (!settings.customerId) {
        throw new PayloadValidationError(
          'Customer ID is required for this action. Please set it in destination settings.'
        )
      }
      settings.customerId = settings.customerId.replace(/-/g, '')

      let cartItems: CartItemInterface[] = []
      if (payload.items) {
        cartItems = payload.items.map((product) => {
          return {
            productId: product.product_id,
            quantity: product.quantity,
            unitPrice: product.price
          } as CartItemInterface
        })
      }

      const request_object: ClickConversionRequestObjectInterface = {
        conversionAction: `customers/${settings.customerId}/conversionActions/${payload.conversion_action}`,
        conversionDateTime: convertTimestamp(payload.conversion_timestamp),
        gclid: payload.gclid,
        gbraid: payload.gbraid,
        wbraid: payload.wbraid,
        orderId: payload.order_id,
        conversionValue: payload.value,
        currencyCode: payload.currency,
        conversionEnvironment: payload.conversion_environment,
        cartData: {
          merchantId: payload.merchant_id,
          feedCountryCode: payload.merchant_country_code,
          feedLanguageCode: payload.merchant_language_code,
          localTransactionCost: payload.local_cost,
          items: cartItems
        },
        userIdentifiers: []
      }
      // Add Consent Signals 'adUserData' if it is defined
      if (payload.ad_user_data_consent_state) {
        request_object['consent'] = {
          adUserData: payload.ad_user_data_consent_state
        }
      }

      // Add Consent Signals 'adPersonalization' if it is defined
      if (payload.ad_personalization_consent_state) {
        request_object['consent'] = {
          ...request_object['consent'],
          adPersonalization: payload.ad_personalization_consent_state
        }
      }

      // Retrieves all of the custom variables that the customer has created in their Google Ads account
      if (payload.custom_variables) {
        const customVariableIds = await getCustomVariables(settings.customerId, auth, request, features, statsContext)
        if (customVariableIds?.data?.length) {
          request_object.customVariables = formatCustomVariables(
            payload.custom_variables,
            customVariableIds.data[0].results
          )
        }
      }

      if (payload.email_address) {
        const validatedEmail: string = commonHashedEmailValidation(payload.email_address)

        request_object.userIdentifiers.push({
          hashedEmail: validatedEmail
        } as UserIdentifierInterface)
      }

      if (payload.phone_number) {
        // remove '+' from phone number if received in payload duplicacy and add '+'
        const phoneNumber = '+' + payload.phone_number.split('+').join('')

        request_object.userIdentifiers.push({
          hashedPhoneNumber: isHashedInformation(payload.phone_number) ? payload.phone_number : hash(phoneNumber)
        } as UserIdentifierInterface)
      }

      const response: ModifiedResponse<PartialErrorResponse> = await request(
        `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/customers/${
          settings.customerId
        }:uploadClickConversions`,
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
    } else {
      throw new IntegrationError(`Unsupported Sync Mode "${syncMode}"`, 'INTEGRATION_ERROR', 400)
    }
  },
  performBatch: async (request, { auth, settings, payload, features, statsContext, syncMode }) => {
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

    const getCustomVariables = memoizedGetCustomVariables()

    const request_objects: ClickConversionRequestObjectInterface[] = await Promise.all(
      payload.map(async (payloadItem) => {
        let cartItems: CartItemInterface[] = []
        if (payloadItem.items && Array.isArray(payloadItem.items)) {
          cartItems = payloadItem.items.map((product) => {
            return {
              productId: product.product_id,
              quantity: product.quantity,
              unitPrice: product.price
            } as CartItemInterface
          })
        }

        const request_object: ClickConversionRequestObjectInterface = {
          conversionAction: `customers/${settings.customerId}/conversionActions/${payloadItem.conversion_action}`,
          conversionDateTime: convertTimestamp(payloadItem.conversion_timestamp),
          gclid: payloadItem.gclid,
          gbraid: payloadItem.gbraid,
          wbraid: payloadItem.wbraid,
          orderId: payloadItem.order_id,
          conversionValue: payloadItem.value,
          currencyCode: payloadItem.currency,
          conversionEnvironment: payloadItem.conversion_environment,
          cartData: {
            merchantId: payloadItem.merchant_id,
            feedCountryCode: payloadItem.merchant_country_code,
            feedLanguageCode: payloadItem.merchant_language_code,
            localTransactionCost: payloadItem.local_cost,
            items: cartItems
          },
          userIdentifiers: []
        }
        // Add Consent Signals 'adUserData' if it is defined
        if (payloadItem.ad_user_data_consent_state) {
          request_object['consent'] = {
            adUserData: payloadItem.ad_user_data_consent_state
          }
        }

        // Add Consent Signals 'adPersonalization' if it is defined
        if (payloadItem.ad_personalization_consent_state) {
          request_object['consent'] = {
            ...request_object['consent'],
            adPersonalization: payloadItem.ad_personalization_consent_state
          }
        }

        // Retrieves all of the custom variables that the customer has created in their Google Ads account
        if (payloadItem.custom_variables) {
          const customVariableIds = await getCustomVariables(customerId, auth, request, features, statsContext)
          if (customVariableIds?.data?.length) {
            request_object.customVariables = formatCustomVariables(
              payloadItem.custom_variables,
              customVariableIds.data[0].results
            )
          }
        }

        if (payloadItem.email_address) {
          const validatedEmail: string = commonHashedEmailValidation(payloadItem.email_address)

          request_object.userIdentifiers.push({
            hashedEmail: validatedEmail
          } as UserIdentifierInterface)
        }

        if (payloadItem.phone_number) {
          // remove '+' from phone number if received in payload duplicacy and add '+'
          const phoneNumber = '+' + payloadItem.phone_number.split('+').join('')

          request_object.userIdentifiers.push({
            hashedPhoneNumber: isHashedInformation(payloadItem.phone_number)
              ? payloadItem.phone_number
              : hash(phoneNumber)
          } as UserIdentifierInterface)
        }

        return request_object
      })
    )

    const response: ModifiedResponse<PartialErrorResponse> = await request(
      `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/customers/${
        settings.customerId
      }:uploadClickConversions`,
      {
        method: 'post',
        headers: {
          'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
        },
        json: {
          conversions: request_objects,
          partialFailure: true
        }
      }
    )
    handleGoogleErrors(response)
    return response
  }
}

export default action
