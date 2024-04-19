import { InputField } from '@segment/actions-core/index'
import { customerDefaultFields, customerProperties } from '../properties/customer'

export const contacts: InputField = {
  type: 'object',
  multiple: true,
  label: 'Contacts',
  description: '',
  properties: customerProperties
}

export const contactsDefault = {
  '@arrayPath': ['$.properties.contacts', customerDefaultFields()]
}
