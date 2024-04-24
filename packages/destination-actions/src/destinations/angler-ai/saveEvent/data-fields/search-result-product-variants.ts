import { InputField } from '@segment/actions-core/index'
import { productVariantDefaultFields, productVariantProperties } from '../properties/product-variant'

export const searchResultProductVariants: InputField = {
  type: 'object',
  multiple: true,
  label: 'Search Result Product Variants',
  description: 'A list of product variants associated with the search result.',
  properties: productVariantProperties
}

export const searchResultProductVariantsDefault = {
  '@arrayPath': ['$.properties.searchResult.productVariants', productVariantDefaultFields()]
}
