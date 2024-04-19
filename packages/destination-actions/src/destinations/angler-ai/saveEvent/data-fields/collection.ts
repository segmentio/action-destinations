import { InputField } from '@segment/actions-core/index'
import { productVariantDefaultFields, productVariantProperties } from '../properties/product-variant'

export const collection: InputField = {
  type: 'object',
  label: 'Collection',
  description: '',
  properties: {
    id: {
      type: 'string',
      label: 'Collection ID',
      description: 'A globally unique identifier.'
    },
    title: {
      type: 'string',
      label: 'Collection Title',
      description: "The collection's name."
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

export const collectionDefault = {
  id: { '@path': '$.properties.collection.id' },
  title: { '@path': '$.properties.collection.title' },
  productVariants: {
    '@arrayPath': ['$.properties.collection.productVariants', productVariantDefaultFields()]
  }
}
