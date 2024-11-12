import { InputField } from '@segment/actions-core/index'

export const productsDefaultProperties = {
  quantity: {
    '@path': '$.quantity'
  },
  id: {
    '@path': '$.product_id'
  },
  variantId: {
    '@path': '$.variant'
  },
  imageSrc: {
    '@path': '$.image_url'
  },
  priceAmount: {
    '@path': '$.price'
  },
  sku: {
    '@path': '$.sku'
  },
  title: {
    '@path': '$.name'
  },
  untranslatedTitle: {
    '@path': '$.untranslated_title'
  },
  vendor: {
    '@path': '$.vendor'
  },
  type: {
    '@path': '$.category'
  },
  url: {
    '@path': '$.url'
  }
}

export const productsFields: InputField = {
  label: '',
  type: 'object',
  multiple: true,
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
  default: {
    '@arrayPath': ['$.properties.products', productsDefaultProperties]
  }
}
