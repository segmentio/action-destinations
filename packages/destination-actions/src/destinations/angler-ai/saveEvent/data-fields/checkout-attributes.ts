import { InputField } from '@segment/actions-core/index'

export const checkoutAttributes: InputField = {
  type: 'object',
  multiple: true,
  label: 'Checkout Attributes',
  description: 'A list of attributes accumulated throughout the checkout process.',
  properties: {
    key: {
      type: 'string',
      label: 'Key',
      description: 'The key of the attribute.'
    },
    value: {
      type: 'string',
      label: 'Value',
      description: 'The value of the attribute.'
    }
  }
}

export const checkoutAttributesDefault = {
  '@arrayPath': [
    '$.properties.checkout.attributes',
    {
      key: { '@path': 'key' },
      value: { '@path': 'value' }
    }
  ]
}
