import { InputField } from '@segment/actions-core/index'
import { productFields } from './productFields'

export const productVariantFields: Record<string, InputField> = {
  productVariant: {
    ...productFields,
    label: 'Product Variant',
    description: 'Product Variant details'
  }
}
