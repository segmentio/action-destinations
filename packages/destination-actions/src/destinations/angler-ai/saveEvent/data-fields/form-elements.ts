import { InputField } from '@segment/actions-core/index'

export const formElements: InputField = {
  type: 'object',
  multiple: true,
  label: 'Form Elements',
  description: 'A list of elements associated with the form.',
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

export const formElementsDefault = {
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
