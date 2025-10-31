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
  getCustomVariables,
  handleGoogleErrors,
  convertTimestamp,
  getApiVersion,
  commonEmailValidation,
  getConversionActionDynamicData,
  memoizedGetCustomVariables,
  formatPhone,
  timestampToEpochMicroseconds
} from '../functions'
import { GOOGLE_ENHANCED_CONVERSIONS_BATCH_SIZE } from '../constants'
import { processHashing } from '../../../lib/hashing-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Click Conversion V2',
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
    user_ip_address: {
      label: 'User IP Address',
      description: 'The IP address of the user who initiated the conversion.',
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },
    session_attributes_encoded: {
      label: 'Session Attributes (Encoded)',
      description:
        "A base64url-encoded JSON string containing session attributes collected from the user's browser. Provides additional attribution context if gclid, gbraid, or user identifiers are missing. ",
      type: 'string',
      default: {
        '@path': '$.integrations.Google Ads Conversions.session_attributes_encoded'
      }
    },
    session_attributes_key_value_pairs: {
      label: 'Session Attributes (Key Value Pairs)',
      description:
        "An alternative to the 'Session Attributes (Encoded)' field which can be used for Offline Conversions. If both 'Session Attributes (Encoded)' and 'Session Attributes (Key Value Pairs)' are provided, the encoded field takes precedence.",
      type: 'object',
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        gad_source: {
          label: 'GAD Source',
          description:
            "An aggregate parameter served in the URL to identify the source of traffic originating from ads. See [Google's docs](https://support.google.com/google-ads/answer/16193746?sjid=2692215861659291994)",
          type: 'string'
        },
        gad_campaignid: {
          label: 'GAD Campaign ID',
          description:
            "The ID of the specific ad campaign that drove the ad click. See [Google's docs](https://support.google.com/google-ads/answer/16193746?sjid=2692215861659291994)",
          type: 'string'
        },
        landing_page_url: {
          label: 'Landing Page URL',
          description:
            'The full URL of the landing page on your website. This indicates the specific page the user first arrived on.',
          type: 'string'
        },
        session_start_time_usec: {
          label: 'Session Start Time',
          description:
            "The timestamp of when the user's session began on your website. This helps track the duration of user visits. The format should be a full ISO 8601 string containing microseconds.",
          type: 'string',
          format: 'date-time'
        },
        landing_page_referrer: {
          label: 'Landing Page Referrer',
          description:
            "The URL of the webpage that linked the user to your website. This helps understand the traffic sources leading to your site. See [Google's docs](https://support.google.com/google-ads/answer/2382957?sjid=658827203196258052)",
          type: 'string'
        },
        landing_page_user_agent: {
          label: 'Landing Page User Agent',
          description:
            "A string that identifies the user's browser and operating system. This information can be useful for understanding the technical environment of your users.",
          type: 'string'
        }
      },
      default: {
        gad_source: {
          '@path': '$.properties.gad_source'
        },
        gad_campaignid: {
          '@path': '$.properties.gad_campaignid'
        },
        landing_page_url: {
          '@path': '$.context.page.url'
        },
        session_start_time_usec: {
          '@path': '$.timestamp'
        },
        landing_page_referrer: {
          '@path': '$.context.page.referrer'
        },
        landing_page_user_agent: {
          '@path': '$.context.userAgent'
        }
      }
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
      description: 'Email address of the individual who triggered the conversion event',
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
    phone_country_code: {
      label: 'Phone Number Country Code',
      description: `The numeric country code to associate with the phone number. If not provided Segment will default to '+1'. If the country code does not start with '+' Segment will add it.`,
      type: 'string'
    },
    phone_number: {
      label: 'Phone Number',
      description:
        'Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000',
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
        'This represents consent for ad user data.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v21/Consent).',
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
        'This represents consent for ad personalization. This can only be set for OfflineUserDataJobService and UserDataService.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v21/Consent).',
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

      const {
        session_attributes_encoded,
        session_attributes_key_value_pairs: {
          gad_source,
          gad_campaignid,
          landing_page_url,
          session_start_time_usec,
          landing_page_referrer,
          landing_page_user_agent
        } = {}
      } = payload

      const sessionStartTimeUsec = session_start_time_usec
        ? timestampToEpochMicroseconds(session_start_time_usec)
        : undefined

      const sessionAttributesKeyValuePairs = {
        ...(gad_source ? { gadSource: gad_source } : {}),
        ...(gad_campaignid ? { gadCampaignId: gad_campaignid } : {}),
        ...(landing_page_url ? { landingPageUrl: landing_page_url } : {}),
        ...(sessionStartTimeUsec ? { sessionStartTimeUsec } : {}),
        ...(landing_page_referrer ? { landingPageReferrer: landing_page_referrer } : {}),
        ...(landing_page_user_agent ? { landingPageUserAgent: landing_page_user_agent } : {})
      }

      const request_object: ClickConversionRequestObjectInterface = {
        conversionAction: `customers/${settings.customerId}/conversionActions/${payload.conversion_action}`,
        conversionDateTime: convertTimestamp(payload.conversion_timestamp),
        gclid: payload.gclid,
        gbraid: payload.gbraid,
        wbraid: payload.wbraid,
        ...(payload.user_ip_address ? { userIpAddress: payload.user_ip_address } : {}),
        ...(session_attributes_encoded ? { sessionAttributesEncoded: session_attributes_encoded } : {}),
        ...(!session_attributes_encoded && Object.keys(sessionAttributesKeyValuePairs).length > 0
          ? { sessionAttributesKeyValuePairs }
          : {}),
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

        const {
          session_attributes_encoded,
          session_attributes_key_value_pairs: {
            gad_source,
            gad_campaignid,
            landing_page_url,
            session_start_time_usec,
            landing_page_referrer,
            landing_page_user_agent
          } = {}
        } = payloadItem

        const sessionStartTimeUsec = session_start_time_usec
          ? timestampToEpochMicroseconds(session_start_time_usec)
          : undefined

        const sessionAttributesKeyValuePairs = {
          ...(gad_source ? { gadSource: gad_source } : {}),
          ...(gad_campaignid ? { gadCampaignId: gad_campaignid } : {}),
          ...(landing_page_url ? { landingPageUrl: landing_page_url } : {}),
          ...(sessionStartTimeUsec ? { sessionStartTimeUsec } : {}),
          ...(landing_page_referrer ? { landingPageReferrer: landing_page_referrer } : {}),
          ...(landing_page_user_agent ? { landingPageUserAgent: landing_page_user_agent } : {})
        }

        const request_object: ClickConversionRequestObjectInterface = {
          conversionAction: `customers/${settings.customerId}/conversionActions/${payloadItem.conversion_action}`,
          conversionDateTime: convertTimestamp(payloadItem.conversion_timestamp),
          gclid: payloadItem.gclid,
          gbraid: payloadItem.gbraid,
          wbraid: payloadItem.wbraid,
          ...(payloadItem.user_ip_address ? { userIpAddress: payloadItem.user_ip_address } : {}),
          ...(session_attributes_encoded ? { sessionAttributesEncoded: session_attributes_encoded } : {}),
          ...(!session_attributes_encoded && Object.keys(sessionAttributesKeyValuePairs).length > 0
            ? { sessionAttributesKeyValuePairs }
            : {}),
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
          const validatedEmail: string = processHashing(
            payloadItem.email_address,
            'sha256',
            'hex',
            commonEmailValidation
          )

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
