import { InputField } from '@segment/actions-core/destination-kit/types'

export const customFields: InputField = {
  label: 'Other Fields',
  description: `
  Additional prospect fields to send to Pardot.  
  Only editable fields are accepted. Please see [Pardot docs](https://developer.salesforce.com/docs/marketing/pardot/guide/prospect-v5.html#fields) for more details. On the left-hand side, input the Pardot field name. On the right-hand side, map the Segment field that contains the value.`,
  type: 'object',
  required: false,
  defaultObjectUI: 'keyvalue'
}
