import { InputField, PathDirective } from '@segment/actions-core/index'
import { moneyAmountDefaultFields, moneyAmountProperties } from './money'
import { productDefaultFields, productProperties } from './product'

export const merchandiseProperties: Record<string, InputField> = {
  id: {
    label: 'ID',
    type: 'string',
    description: 'A globally unique identifier.'
  },
  image: {
    label: 'Image',
    type: 'object',
    description:
      'Image associated with the product variant. This field falls back to the product image if no image is available.',
    properties: {
      src: {
        label: 'Source URL',
        type: 'string',
        description: 'The location of the image as a URL.'
      }
    }
  },
  price: {
    label: 'Price',
    type: 'object',
    description: 'A monetary value with currency.',
    properties: moneyAmountProperties
  },
  product: {
    label: 'Product',
    type: 'object',
    description: 'The product object that the product variant belongs to.',
    properties: productProperties
  },
  sku: {
    label: 'SKU',
    type: 'string',
    description: 'The SKU (stock keeping unit) associated with the variant.'
  },
  title: {
    label: 'Title',
    type: 'string',
    description: "The product variant's title."
  },
  untranslatedTitle: {
    label: 'Untranslated Title',
    type: 'string',
    description: "The product variant's untranslated title."
  }
}

export function merchandiseDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    id: { '@path': `${path}id` },
    image: {
      src: { '@path': `${path}image.src` }
    },
    price: moneyAmountDefaultFields(`${path}price`),
    product: productDefaultFields(`${path}product`),
    sku: { '@path': `${path}sku` },
    title: { '@path': `${path}title` },
    untranslatedTitle: { '@path': `${path}untranslatedTitle` }
  }
}
