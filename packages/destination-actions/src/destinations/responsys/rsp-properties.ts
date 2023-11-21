import { InputField } from '@segment/actions-core/destination-kit/types'
// import { IntegrationError } from '@segment/actions-core'

export const userData: InputField = {
  label: 'Recepient Data',
  description: 'Record data that represents Field Names and corresponding values for the recipient.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  required: true
}
