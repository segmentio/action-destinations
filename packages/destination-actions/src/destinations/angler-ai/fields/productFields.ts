import { InputField } from '@segment/actions-core/index'

export const productDefaultProperties = {
  quantity: {
    '@path': '$.properties.quantity'
  },
  id: {
    '@path': '$.properties.product_id'
  },
  variantId: {
    '@path': '$.properties.variant'
  },
  imageSrc: {
    '@path': '$.properties.image_url'
  },
  priceAmount: {
    '@path': '$.properties.price'
  },
  sku: {
    '@path': '$.properties.sku'
  },
  title: {
    '@path': '$.properties.name'
  },
  untranslatedTitle: {
    '@if': {
      exists: [{ '@path': '$.properties.variant' }],
      then: { '@path': '$.properties.variant' },
      else: { '@path': '$.properties.title' }
    }
  },
  vendor: {
    '@path': '$.properties.vendor'
  },
  type: {
    '@path': '$.properties.category'
  },
  url: {
    '@path': '$.properties.url'
  }
}

export const productFields: InputField = {
  label: '',
  type: 'object',
  description: '',
  properties: {
    id: {
      label: 'Product Id',
      type: 'string',
      description: 'A globally unique identifier for the item.'
    },
    variantId: {
      label: 'Variant Id',
      type: 'string',
      description: 'Identifier for the variant of the product'
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
    vendor: {
      label: 'Vendor',
      type: 'string',
      description: "The product's vendor name."
    },
    type: {
      label: 'Type',
      type: 'string',
      description: 'The product type specified by the merchant.'
    },
    url: {
      label: 'URL',
      type: 'string',
      description: 'The relative URL of the product.'
    }
  },
  default: productDefaultProperties
}
