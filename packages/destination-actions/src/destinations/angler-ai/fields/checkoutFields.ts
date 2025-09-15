import { InputField } from '@segment/actions-core/index'
import { addressDefaultFields, addressProperties } from '../fields/addressFields'
import { productsDefaultProperties, productsFields } from './productsFields'

export const checkoutFields: Record<string, InputField> = {
  checkout: {
    label: 'Checkout',
    type: 'object',
    description: 'Checkout details',
    properties: {
      totalAmount: {
        label: 'Total Amount',
        type: 'number',
        description: 'Decimal money amount.',
        default: {
          '@path': '$.properties.total'
        }
      },
      currencyCode: {
        label: 'Currency Code',
        type: 'string',
        description: 'The currency code of the money.',
        default: {
          '@path': '$.properties.currency'
        }
      },
      orderId: {
        label: 'Order ID',
        type: 'string',
        description: 'The ID of the order associated with this checkout.',
        default: {
          '@path': '$.properties.order_id'
        }
      },
      subtotalPriceAmount: {
        label: 'Subtotal Price Amount',
        type: 'number',
        description: 'A monetary value.',
        default: {
          '@path': '$.properties.subtotal'
        }
      },
      totalTaxAmount: {
        label: 'Total Tax Amount',
        type: 'number',
        description: 'A monetary value with currency.',
        default: {
          '@path': '$.properties.tax'
        }
      },
      shippingLinePriceAmount: {
        label: 'Shipping Line Price Amount',
        type: 'number',
        description: 'A monetary value.',
        default: {
          '@path': '$.properties.shipping'
        }
      }
    }
  },
  checkoutLineItems: {
    ...productsFields,
    label: 'Checkout Line Items',
    description: 'Checkout Line Item details',
    properties: {
      ...productsFields.properties,
      quantity: {
        label: 'Quantity',
        type: 'number',
        description: 'Quantity of the item'
      },
      discountTitle: {
        label: 'Discount Title',
        type: 'string',
        description: 'The Discount Code applied to the item.'
      },
      discountValue: {
        label: 'Discount Value',
        type: 'number',
        description: 'The Discount value applied to the item.'
      }
    },
    default: {
      '@arrayPath': [
        '$.properties.products',
        {
          ...productsDefaultProperties,
          quantity: {
            '@path': '$.quantity'
          },
          discountTitle: {
            '@path': '$.coupon'
          },
          discountValue: {
            '@path': '$.discount'
          }
        }
      ]
    }
  },
  checkoutBillingAddress: {
    type: 'object',
    label: 'Checkout Billing Address',
    description: 'The billing address associated with the checkout.',
    properties: addressProperties,
    default: addressDefaultFields('$.properties.billing_address')
  },
  checkoutShippingAddress: {
    type: 'object',
    label: 'Checkout Shipping Address',
    description: 'The address to which the order will be shipped.',
    properties: addressProperties,
    default: addressDefaultFields('$.properties.shipping_address')
  }
}
