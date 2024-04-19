import { InputField } from '@segment/actions-core/index'
import { customerDefaultFields, customerProperties } from '../properties/customer'

export const customer: InputField = {
  type: 'object',
  label: 'Customer',
  description: '',
  properties: customerProperties
}

export const customerDefault = customerDefaultFields('$.properties.customer')
