import { InputField } from '@segment/actions-core/index'
import { productVariantDefaultFields, productVariantProperties } from '../properties/product-variant'

export const productVariant: InputField = {
  type: 'object',
  label: 'Product Variant',
  description: 'Product variant of the line item',
  properties: productVariantProperties
}

export const productVariantDefault = productVariantDefaultFields('$.properties.productVariant')
