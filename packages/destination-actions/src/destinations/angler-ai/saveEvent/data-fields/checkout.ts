import { InputField } from '@segment/actions-core/index'
import { moneyAmountDefaultFields, moneyAmountProperties } from '../properties/money'
import { addressDefaultFields, addressProperties } from '../properties/address'
import { discountApplicationDefaultFields, discountApplicationProperties } from '../properties/discount-application'
import { productVariantDefaultFields, productVariantProperties } from '../properties/product-variant'

export const checkout: InputField = {
  label: 'Checkout',
  type: 'object',
  description: 'Information about the checkout process.',
  properties: {
    attributes: {
      label: 'Attributes',
      type: 'object',
      multiple: true,
      description: 'A list of attributes accumulated throughout the checkout process.',
      properties: {
        key: {
          label: 'Key',
          type: 'string',
          required: true,
          description: 'The key identifier for the attribute.'
        },
        value: {
          label: 'Value',
          type: 'string',
          description: 'The value of the attribute.'
        }
      }
    },
    billingAddress: {
      label: 'Billing Address',
      type: 'object',
      description: 'Billing address information.',
      properties: addressProperties
    },
    currencyCode: {
      label: 'Currency Code',
      type: 'string',
      description:
        'The three-letter code that represents the currency, for example, USD. Supported codes include standard ISO 4217 codes, legacy codes, and non-standard codes.'
    },
    discountApplications: {
      label: 'Discount Applications',
      type: 'object',
      multiple: true,
      description: 'A list of discount applications.',
      properties: discountApplicationProperties
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'The email attached to this checkout.'
    },
    lineItems: {
      label: 'Line Items',
      type: 'object',
      multiple: true,
      description: 'A list of line item objects, each one containing information about an item in the checkout.',
      properties: {
        discountAllocations: {
          label: 'Discount Allocations',
          type: 'object',
          multiple: true,
          description: 'A list of discount applications that are applicable to this line item.',
          properties: {
            amount: {
              label: 'Allocated Amount',
              type: 'object',
              description: 'The amount of the discount allocated to the line item.',
              properties: moneyAmountProperties
            },
            discountApplication: {
              label: 'Discount Application',
              type: 'object',
              description:
                'Discount applications capture the intentions of a discount source at the time of application.',
              properties: discountApplicationProperties
            }
          }
        },
        id: {
          label: 'ID',
          type: 'string',
          description: 'A globally unique identifier.'
        },
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'The quantity of the line item.'
        },
        title: {
          label: 'Title',
          type: 'string',
          description: "The title of the line item. Defaults to the product's title."
        },
        variant: {
          label: 'Variant',
          type: 'object',
          description: 'Product variant of the line item.',
          properties: productVariantProperties
        }
      }
    },
    order: {
      label: 'Order',
      type: 'object',
      description: 'The order object associated with this checkout.',
      properties: {
        id: {
          label: 'ID',
          type: 'string',
          description: 'The ID of the order.'
        }
      }
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description: 'A unique phone number for the customer.'
    },
    shippingAddress: {
      label: 'Billing Address',
      type: 'object',
      description: 'An address.',
      properties: addressProperties
    },
    shippingLine: {
      label: 'Shipping Line',
      type: 'object',
      description: 'A shipping line object.',
      properties: {
        price: {
          label: 'Price',
          type: 'object',
          description: 'A monetary value with currency.',
          properties: moneyAmountProperties
        }
      }
    },
    subtotalPrice: {
      label: 'Subtotal Price',
      type: 'object',
      description: 'A monetary value with currency.',
      properties: moneyAmountProperties
    },
    token: {
      label: 'Token',
      type: 'string',
      description: 'A unique identifier for a particular checkout.'
    },
    totalPrice: {
      label: 'Total Price',
      type: 'object',
      description: 'A monetary value with currency.',
      properties: moneyAmountProperties
    },
    totalTax: {
      label: 'Total Tax',
      type: 'object',
      description: 'A monetary value with currency.',
      properties: moneyAmountProperties
    }
  }
}

export const checkoutDefault = {
  attributes: {
    '@arrayPath': [
      '$.properties.checkout.attributes',
      {
        key: { '@path': 'key' },
        value: { '@path': 'value' }
      }
    ]
  },
  billingAddress: addressDefaultFields('$.properties.checkout.billingAddress'),
  currencyCode: { '@path': '$.properties.checkout.currencyCode' },
  discountApplications: {
    '@arrayPath': ['$.properties.checkout.discountApplications', discountApplicationDefaultFields()]
  },
  email: { '@path': '$.properties.checkout.email' },
  lineItems: {
    '@arrayPath': [
      '$.properties.checkout.lineItems',
      {
        discountAllocations: {
          '@arrayPath': [
            'discountAllocations',
            {
              amount: moneyAmountDefaultFields('amount'),
              discountApplication: discountApplicationDefaultFields('discountApplication')
            }
          ]
        },
        id: { '@path': 'id' },
        quantity: { '@path': 'quantity' },
        title: { '@path': 'title' },
        variant: productVariantDefaultFields('variant')
      }
    ]
  },
  order: {
    id: { '@path': '$.properties.checkout.order.id' }
  },
  phone: { '@path': '$.properties.checkout.phone' },
  shippingAddress: addressDefaultFields('$.properties.checkout.shippingAddress'),
  shippingLine: {
    price: moneyAmountDefaultFields('$.properties.checkout.shippingLine.price')
  },
  subtotalPrice: moneyAmountDefaultFields('$.properties.checkout.subtotalPrice'),
  token: { '@path': '$.properties.checkout.token' },
  totalPrice: moneyAmountDefaultFields('$.properties.checkout.totalPrice'),
  totalTax: moneyAmountDefaultFields('$.properties.checkout.totalTax')
}
