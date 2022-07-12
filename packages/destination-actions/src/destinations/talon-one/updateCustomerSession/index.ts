import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, attributesInfo, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Sessions',
  description: 'This updates a customer session.',
  fields: {
    customerSessionId: {
      label: 'Customer Session ID',
      description: 'The customer session integration identifier to use in Talon.One.',
      type: 'string',
      required: true
    },
    callbackDestination: {
      label: 'Callback Destination URI',
      description: 'This specifies the address of the service and its endpoint to do callback request.',
      type: 'string',
      placeholder: 'http://mydomain.com/api/callback_here'
    },
    callbackAPIKey: {
      type: 'string',
      label: 'Callback API Key',
      description: 'This specifies API key and relative header. The header is specified optionally',
      placeholder: 'X-API-Key 123456789123456789123456789123456789'
    },
    callbackForwardedFields: {
      type: 'string',
      label: 'Callback Forwarded Fields',
      description:
        'This specifies a list of the fields from the response you need to receive. Comma character is separator. If omitted, all the fields will be forwarded from the response.',
      placeholder: 'effects,customerProfile',
      default: 'effects'
    },
    callbackCorrelationId: {
      type: 'string',
      label: 'Correlation ID',
      description:
        'This specifies ID of the request that will be forwarded to the destination URI with the callback request with the same header name. If omitted, the X-Correlation-ID will not be in the callback request.'
    },
    customerSession: {
      label: 'Customer Profile ID',
      description: 'This contains all the data related to customer session.',
      type: 'object',
      required: true,
      properties: {
        profileId: { ...customerProfileId, required: false },
        couponCodes: {
          label: 'Coupon Codes',
          description: 'Any coupon codes entered. Up to 100 coupons.`',
          type: 'string',
          multiple: true
        },
        referralCode: {
          label: 'Referral Codes',
          description: 'Any referral code entered.`',
          type: 'string'
        },
        loyaltyCards: {
          label: 'Referral Codes',
          description: 'Any loyalty cards used. Up to 1 loyalty cards.`',
          type: 'string',
          multiple: true
        },
        state: {
          label: 'State',
          description: 'Indicates the current state of the session. `',
          type: 'string',
          choices: [
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
            { label: 'Partially returned', value: 'partially_returned' },
            { label: 'Cancelled', value: 'cancelled' }
          ]
        },
        cardItems: {
          label: 'Card Items',
          description:
            'The items to add to this sessions.\n' +
            '\n' +
            'If cart item flattening is disabled: Do not exceed 1000 items (regardless of their quantity) per request.\n' +
            "If cart item flattening is enabled: Do not exceed 1000 items and ensure the sum of all cart item's quantity does not exceed 10.000 per request.`",
          type: 'object',
          multiple: true,
          required: false,
          properties: {
            name: {
              label: 'Name',
              description: 'Name of item',
              type: 'string',
              required: true
            },
            sku: {
              label: 'SKU',
              description: 'Stock keeping unit of item.',
              type: 'string',
              required: true
            },
            quantity: {
              label: 'Quantity',
              description:
                'Quantity of item. Important: If you enabled cart item flattening, the quantity is always one and the same cart item might receive multiple per-item discounts. Ensure you can process multiple discounts on one cart item correctly.',
              type: 'number',
              required: true
            },
            price: {
              label: 'Price',
              description: 'Price of item.',
              type: 'number',
              required: true
            },
            returnedQuantity: {
              label: 'Returned quantity',
              description: 'Number of returned items, calculated internally based on returns of this item.',
              type: 'string'
            },
            remainingQuantity: {
              label: 'Remaining quantity',
              description: 'Remaining quantity of the item, calculated internally based on returns of this item.',
              type: 'string'
            },
            category: {
              label: 'Category',
              description: 'Type, group or model of the item.',
              type: 'string'
            },
            weight: {
              label: 'Weight',
              description: 'Weight of item in grams.',
              type: 'string'
            },
            height: {
              label: 'Height',
              description: 'Height of item in mm.',
              type: 'string'
            },
            length: {
              label: 'Length',
              description: 'Length of item in mm.',
              type: 'string'
            },
            position: {
              label: 'Position',
              description: 'Position of the Cart Item in the Cart (calculated internally).',
              type: 'string'
            },
            attributes: {
              ...attribute,
              default: {
                '@path': '$.properties.attributes'
              },
              description:
                'Use this property to set a value for the attributes of your choice. Attributes represent any information to attach to this cart item.\n' +
                '\n' +
                'Custom cart item attributes must be created in the Campaign Manager before you set them with this property.\n' +
                '\n' +
                '[See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).'
            },
            additionalCosts: {
              label: 'Additional Costs',
              description:
                'Use this property to set a value for the additional costs of this session, such as a shipping cost.`',
              type: 'object'
            }
          }
        },
        additionalCosts: {
          label: 'Additional Costs',
          description:
            'Use this property to set a value for the additional costs of this session, such as a shipping cost.`',
          type: 'object'
        },
        attributes: {
          ...attribute,
          default: {
            '@path': '$.properties.attributes'
          },
          description:
            'Use this property to set a value for the attributes of your choice. Attributes represent any information to attach to your session, like the shipping city. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).'
        }
      }
    },
    sessionAttributesInfo: { ...attributesInfo },
    cartItemsAttributesInfo: { ...attributesInfo }
  },
  perform: (request, { payload }) => {
    return request(`https://integration.talon.one/segment/customer_sessions/${payload.customerSessionId}`, {
      method: 'put',
      headers: {
        'X-Callback-Destination-URI': `${payload.callbackDestination}`,
        'X-Callback-API-Key': `${payload.callbackAPIKey}`,
        'X-Callback-Forwarded-Fields': `${payload.callbackForwardedFields}`,
        'X-Correlation-ID': `${payload.callbackCorrelationId}`
      },
      json: {
        customerSession: payload.customerSession,
        sessionAttributesInfo: payload.sessionAttributesInfo,
        cartItemAttributesInfo: payload.cartItemsAttributesInfo
      }
    })
  }
}

export default action
