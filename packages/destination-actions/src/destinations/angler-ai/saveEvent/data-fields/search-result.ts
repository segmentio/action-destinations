import { InputField } from '@segment/actions-core/index'
import { productVariantDefaultFields, productVariantProperties } from '../properties/product-variant'

export const searchResult: InputField = {
  type: 'object',
  label: 'Search Result',
  description: '',
  properties: {
    query: {
      type: 'string',
      label: 'Query',
      description: 'The search query that was executed.'
    },
    productVariants: {
      type: 'object',
      multiple: true,
      label: 'Product Variants',
      description: 'Product variant of the line item.',
      properties: productVariantProperties
    }
  }
}

export const searchResultDefault = {
  query: { '@path': '$.properties.searchResult.query' },
  productVariants: {
    '@arrayPath': ['$.properties.searchResult.productVariants', productVariantDefaultFields()]
  }
}
