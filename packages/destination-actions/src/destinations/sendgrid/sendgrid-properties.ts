import { InputField } from '@segment/actions-core'
import { Payload } from './updateUserProfile/generated-types'

export const customFields: InputField = {
  label: 'Other Fields',
  description: `
  Additional fields to send to SendGrid. On the left-hand side, input the SendGrid Custom Fields Id. On the right-hand side, map the Segment field that contains the value.

  Custom Fields must be predefined in your SendGrid account and you can retrieve corresponding Id using get all field definitions endpoint.

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
