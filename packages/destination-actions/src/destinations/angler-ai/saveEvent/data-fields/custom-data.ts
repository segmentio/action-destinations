import { InputField } from '@segment/actions-core/index'

export const customData: InputField = {
  type: 'object',
  multiple: true,
  label: 'Custom Data',
  description: '',
  properties: {
    name: {
      type: 'string',
      label: 'Name'
    },
    value: {
      type: 'string',
      label: 'Value'
    }
  }
}

export const customDataDefault = {
  '@arrayPath': [
    '$.properties.customData',
    {
      name: { '@path': 'name' },
      value: { '@path': 'value' }
    }
  ]
}
