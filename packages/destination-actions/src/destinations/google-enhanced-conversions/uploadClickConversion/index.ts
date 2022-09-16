import { ActionDefinition, IntegrationError, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CartItem, QueryResponse, PartialFailureError } from '../types'
import { formatCustomVariables, hash } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upload Click Conversion',
  description: 'Upload an offline click conversion to the Google Ads API.',
  fields: {
    conversion_action: {
      label: 'Conversion Action ID',
      description:
        'The ID of the conversion action associated with this conversion. To find the Conversion Action ID, click on your conversion in Google Ads and get the value for ctId in the URL. For example, if the URL is https://ads.google.com/aw/conversions/detail?ocid=00000000&ctId=570000000, your Conversion Action ID is 570000000.',
      type: 'string',
      required: true,
      default: ''
    },
    gclid: {
      label: 'GCLID',
      description: 'The Google click ID (gclid) associated with this conversion.',
      type: 'string',
      default: ''
    },
    gbraid: {
      label: 'GBRAID',
      description:
        'The click identifier for clicks associated with app conversions and originating from iOS devices starting with iOS14.',
      type: 'string',
      default: ''
    },
    wbraid: {
      label: 'WBRAID',
      description:
        'The click identifier for clicks associated with web conversions and originating from iOS devices starting with iOS14.',
      type: 'string',
      default: ''
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
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$context.traits.email' }
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
          else: { '@path': '$context.traits.phone' }
        }
      }
    },
    order_id: {
      label: 'Order ID',
      description:
        'The order ID associated with the conversion. An order id can only be used for one conversion per conversion action.',
      type: 'string',
      default: {
        '@path': '$.properties.orderId'
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
      description: 'The environment this conversion was recorded on. e.g. App or Web.',
      type: 'string',
      choices: [
        { label: 'APP', value: 'APP' },
        { label: 'WEB', value: 'WEB' },
        { label: `UNSPECIFIED`, value: 'UNSPECIFIED' }
      ]
    },
    merchant_id: {
      label: 'Merchant Center ID',
      description: 'The ID of the Merchant Center account where the items are uploaded.',
      type: 'string',
      default: ''
    },
    merchant_country_code: {
      label: 'Merchant Center Feed Country Code',
      description: 'The ISO 3166 two-character region code of the Merchant Center feed where the items are uploaded.',
      type: 'string',
      default: ''
    },
    merchant_language_code: {
      label: 'Merchant Center Feed Language Code',
      description: 'The ISO 639-1 language code of the Merchant Center feed where the items are uploaded.',
      type: 'string',
      default: ''
    },
    local_cost: {
      label: 'Local Transaction Cost',
      description:
        'Sum of all transaction-level discounts, such as free shipping and coupon discounts for the whole cart.',
      type: 'number',
      default: ''
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
      defaultObjectUI: 'keyvalue'
    }
  },
  perform: async (request, { auth, settings, payload }) => {
    if (!settings.customerId) {
      throw new IntegrationError(
        'Customer id is required for this action. Please set it in destination settings.',
        'Missing required fields.',
        400
      )
    }
    settings.customerId = settings.customerId.replace(/[^0-9.]+/g, '')

    let cartItems: CartItem[] = []
    if (payload.items) {
      cartItems = payload.items.map((product) => {
        return {
          productId: product.product_id,
          quantity: product.quantity,
          unitPrice: product.price
        } as CartItem
      })
    }

    // Retrieves all of the custom variables that the customer has created in their Google Ads account.
    const customVariableIds: ModifiedResponse<Array<QueryResponse>> = await request(
      `https://googleads.googleapis.com/v11/customers/${settings.customerId}/googleAds:searchStream`,
      {
        method: 'post',
        headers: {
          authorization: `Bearer ${auth?.accessToken}`,
          'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
        },
        json: {
          query: `SELECT conversion_custom_variable.id, conversion_custom_variable.name FROM conversion_custom_variable`
        }
      }
    )

    const request_object: { [key: string]: any } = {
      conversionAction: `customers/${settings.customerId}/conversionActions/${payload.conversion_action}`,
      conversionDateTime: payload.conversion_timestamp.replace(/T/, ' ').replace(/\..+/, '+00:00'),
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
      userIdentifiers: [],
      customVariables: formatCustomVariables(payload.custom_variables, customVariableIds.data[0].results)
    }

    if (payload.email_address) {
      request_object.userIdentifiers.push({ hashedEmail: hash(payload.email_address) })
    }

    if (payload.phone_number) {
      request_object.userIdentifiers.push({ hashedPhoneNumber: hash(payload.phone_number) })
    }

    const response: ModifiedResponse<PartialFailureError> = await request(
      `https://googleads.googleapis.com/v11/customers/${settings.customerId}:uploadClickConversions`,
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
    if (response.data.partialFailureError.code != 0) {
      throw new IntegrationError(response.data.partialFailureError.message, 'INVALID_ARGUMENT', 400)
    }
    return response
  }
}

export default action
