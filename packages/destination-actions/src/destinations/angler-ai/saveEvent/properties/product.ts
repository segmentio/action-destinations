import { InputField, PathDirective } from '@segment/actions-core/index'

export const productProperties: Record<string, InputField> = {
  id: {
    label: 'Product ID',
    type: 'string',
    description: 'The ID of the product.'
  },
  title: {
    label: 'Title',
    type: 'string',
    description: "The product's title."
  },
  untranslatedTitle: {
    label: 'Untranslated Title',
    type: 'string',
    description: "The product's untranslated title."
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
}

export function productDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    id: { '@path': `${path}id` },
    title: { '@path': `${path}title` },
    untranslatedTitle: { '@path': `${path}untranslatedTitle` },
    vendor: { '@path': `${path}vendor` },
    type: { '@path': `${path}type` },
    url: { '@path': `${path}url` }
  }
}
