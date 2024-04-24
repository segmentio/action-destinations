import { InputField } from '@segment/actions-core/index'
import { addressDefaultFields, addressProperties } from '../properties/address'
import addPrefixToProperties, { addPrefixToDefaultFields } from '../../utils'

export const checkout: InputField = {
  label: 'Checkout',
  type: 'object',
  description: 'Information about the checkout process.',
  properties: {
    ...addPrefixToProperties(addressProperties, 'billing'),
    currencyCode: {
      label: 'Currency Code',
      type: 'string',
      description:
        'The three-letter code that represents the currency, for example, USD. Supported codes include standard ISO 4217 codes, legacy codes, and non-standard codes.'
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'The email attached to this checkout.'
    },
    orderId: {
      label: 'Order ID',
      type: 'string',
      description: 'The ID of the order associated with this checkout.'
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description: 'A unique phone number for the customer.'
    },
    ...addPrefixToProperties(addressProperties, 'shipping'),
    shippingLinePriceAmount: {
      label: 'Shipping Line Price Amount',
      type: 'number',
      description: 'A monetary value.'
    },
    shippingLinePriceCurrencyCode: {
      label: 'Shipping Line Price Currency Code',
      type: 'string',
      description: 'The currency code of the money.'
    },
    subtotalPriceAmount: {
      label: 'Subtotal Price Amount',
      type: 'number',
      description: 'A monetary value.'
    },
    subtotalPriceCurrencyCode: {
      label: 'Subtotal Price Currency Code',
      type: 'string',
      description: 'The currency code of the money.'
    },
    token: {
      label: 'Token',
      type: 'string',
      description: 'A unique identifier for a particular checkout.'
    },
    totalPriceAmount: {
      label: 'Total Price Amount',
      type: 'number',
      description: 'A monetary value.'
    },
    totalPriceCurrencyCode: {
      label: 'Total Price Currency Code',
      type: 'string',
      description: 'The currency code of the money.'
    },
    totalTaxAmount: {
      label: 'Total Tax Amount',
      type: 'number',
      description: 'A monetary value with currency.'
    },
    totalTaxCurrencyCode: {
      label: 'Total Tax Currency Code',
      type: 'string',
      description: 'The currency code of the money.'
    }
  }
}

export const checkoutDefault = {
  ...addPrefixToDefaultFields(addressDefaultFields('$.properties.checkout'), 'billing', '$.properties.checkout'),
  currencyCode: { '@path': '$.properties.checkout.currencyCode' },
  email: { '@path': '$.properties.checkout.email' },
  orderId: { '@path': '$.properties.checkout.orderId' },
  phone: { '@path': '$.properties.checkout.phone' },
  ...addPrefixToDefaultFields(addressDefaultFields('$.properties.checkout'), 'shipping', '$.properties.checkout'),
  shippingLinePriceAmount: { '@path': '$.properties.checkout.shippingLinePriceAmount' },
  shippingLinePriceCurrencyCode: { '@path': '$.properties.checkout.shippingLinePriceCurrencyCode' },
  subtotalPriceAmount: {
    '@path': '$.properties.checkout.subtotalPriceAmount'
  },
  subtotalPriceCurrencyCode: { '@path': '$.properties.checkout.subtotalPriceCurrencyCode' },
  token: { '@path': '$.properties.checkout.token' },
  totalPriceAmount: { '@path': '$.properties.checkout.totalPriceAmount' },
  totalPriceCurrencyCode: { '@path': '$.properties.checkout.totalPriceCurrencyCode' },
  totalTaxAmount: { '@path': '$.properties.checkout.totalTaxAmount' },
  totalTaxCurrencyCode: { '@path': '$.properties.checkout.totalTaxCurrencyCode' }
}
