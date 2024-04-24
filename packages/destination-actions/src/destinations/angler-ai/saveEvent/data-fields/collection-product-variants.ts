import { InputField } from '@segment/actions-core/index'
import { productVariantDefaultFields, productVariantProperties } from '../properties/product-variant'

export const collectionProductVariants: InputField = {
  type: 'object',
  multiple: true,
  label: 'Collection Product Variants',
  description: 'A list of product variants associated with the collection.',
  properties: productVariantProperties
}

export const collectionProductVariantDefault = {
  '@arrayPath': ['$.properties.collection.productVariants', productVariantDefaultFields()]
}
