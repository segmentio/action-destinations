import { InputField } from '@segment/actions-core/index'

export const form: InputField = {
  type: 'object',
  label: 'Form',
  description: '',
  properties: {
    id: {
      type: 'string',
      label: 'Form ID',
      description: 'The id attribute of an element.'
    },
    action: {
      type: 'string',
      label: 'Action',
      description: 'The action attribute of a form element.'
    },
    elements: {
      type: 'object',
      multiple: true,
      label: 'Elements',
      properties: {
        id: {
          type: 'string',
          label: 'Element ID',
          description: 'The id attribute of an element.'
        },
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name attribute of an element.'
        },
        tagName: {
          type: 'string',
          label: 'Tag Name',
          description: 'A string representation of the tag of an element.'
        },
        type: {
          type: 'string',
          label: 'Type',
          description: 'The type attribute of an element. Often relevant for an input or button element.'
        },
        value: {
          type: 'string',
          label: 'Value',
          description: 'The value attribute of an element. Often relevant for an input element.'
        }
      }
    }
  }
}

export const formDefault = {
  id: { '@path': '$.properties.form.id' },
  action: { '@path': '$.properties.form.action' },
  elements: {
    '@arrayPath': [
      '$.properties.form.elements',
      {
        id: { '@path': 'id' },
        name: { '@path': 'name' },
        tagName: { '@path': 'tagName' },
        type: { '@path': 'type' },
        value: { '@path': 'value' }
      }
    ]
  }
}
