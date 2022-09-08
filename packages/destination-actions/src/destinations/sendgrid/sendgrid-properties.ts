import { InputField } from '@segment/actions-core'
import { Payload } from './updateUserProfile/generated-types'

export const customFields: InputField = {
  label: 'Other Fields',
  description: `
  Additional fields to send to Sendgrid. On the left-hand side, input the Sendgrid field API name. On the right-hand side, map the Segment field that contains the value.

  This can include standard or custom fields. Custom fields must be predefined in your Sendgrid account and the API field name should have __c appended.

  Reference: https://docs.sendgrid.com/api-reference/custom-fields/get-all-field-definitions
  ---

  `,
  type: 'object',
  defaultObjectUI: 'keyvalue'
}

export const convertPayload = (payload: Payload) => {
  const { state, primary_email, enable_batching, customFields, ...rest } = payload
  return { ...rest, state_province_region: state, email: primary_email, custom_fields: customFields }
}
