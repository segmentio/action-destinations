import { InputField } from '@segment/actions-core/index'
import { productVariantDefaultFields, productVariantProperties } from '../properties/product-variant'
import { discountApplicationProperties } from '../properties/discount-application'
import addPrefixToProperties, { addPrefixToDefaultFields } from '../../utils'

export const checkoutLineItems: InputField = {
  label: 'Checkout Line Items',
  type: 'object',
  multiple: true,
  description: 'A list of line item objects, each one containing information about an item in the checkout.',
  properties: {
    discountAllocations: {
      label: 'Discount Allocations',
      type: 'object',
      multiple: true,
      description: 'The discounts that have been applied to the checkout line item by a discount application.',
      properties: {
        amount: {
          label: 'Amount',
          type: 'number',
          description: 'Decimal money amount.'
        },
        currencyCode: {
          label: 'Currency Code',
          type: 'string',
          description: 'Currency of the money.'
        },
        ...discountApplicationProperties
      }
    },
    id: {
      label: 'Checkout Line Item ID',
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
    ...addPrefixToProperties(productVariantProperties, 'productVariant')
  }
}

export const checkoutLineItemsDefault = {
  '@arrayPath': [
    '$.properties.checkout.lineItems',
    {
      discountAllocations: { '@path': 'discountAllocations' },
      id: { '@path': 'id' },
      quantity: { '@path': 'quantity' },
      title: { '@path': 'title' },
      ...addPrefixToDefaultFields(productVariantDefaultFields(), 'productVariant')
    }
  ]
}
