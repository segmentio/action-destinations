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
    }
  }
}

export const formDefault = {
  id: { '@path': '$.properties.form.id' },
  action: { '@path': '$.properties.form.action' }
}
