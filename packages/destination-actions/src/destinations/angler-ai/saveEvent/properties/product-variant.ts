import { InputField, PathDirective } from '@segment/actions-core/index'
import { productDefaultFields, productProperties } from './product'
import addPrefixToProperties, { addPrefixToDefaultFields } from '../../utils'

export const productVariantProperties: Record<string, InputField> = {
  id: {
    label: 'Merchandise Id',
    type: 'string',
    description: 'A globally unique identifier.'
  },
  imageSrc: {
    label: 'Image Source URL',
    type: 'string',
    description: 'The location of the image as a URL.'
  },
  priceAmount: {
    label: 'Price Amount',
    type: 'number',
    description: 'The price of the product variant.'
  },
  priceCurrencyCode: {
    label: 'Price Currency Code',
    type: 'string',
    description: 'The currency code of the price.'
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
  },
  ...addPrefixToProperties(productProperties, 'product')
}

export function productVariantDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    id: { '@path': `${path}id` },
    imageSrc: { '@path': `${path}imageSrc` },
    priceAmount: { '@path': `${path}priceAmount` },
    priceCurrencyCode: { '@path': `${path}priceCurrencyCode` },
    sku: { '@path': `${path}sku` },
    title: { '@path': `${path}title` },
    untranslatedTitle: { '@path': `${path}untranslatedTitle` },
    ...addPrefixToDefaultFields(productDefaultFields(path), 'product', path)
  }
}
