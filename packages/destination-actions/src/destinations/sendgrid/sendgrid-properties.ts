import { InputField, RequestClient } from '@segment/actions-core'
import { Payload } from './updateUserProfile/generated-types'

export const customFields: InputField = {
  label: 'Other Fields',
  description: `
  Additional fields to send to SendGrid. On the left-hand side, input the SendGrid Custom Fields Id. On the right-hand side, map the Segment field that contains the value.

  Custom Fields must be predefined in your SendGrid account and you can retrieve corresponding Id using get all field definitions endpoint.

  Reference: [Get All field definitions](https://docs.sendgrid.com/api-reference/custom-fields/get-all-field-definitions)
  ---

  `,
  type: 'object',
  defaultObjectUI: 'keyvalue'
}

export interface CustomField {
  id: string
  name: string
}

interface APIData {
  custom_fields?: CustomField[]
}

// Fetch all custom field definitions for the account using the Sendgrid API
// https://docs.sendgrid.com/api-reference/custom-fields/get-all-field-definitions
export const fetchAccountCustomFields = async (request: RequestClient): Promise<CustomField[]> => {
  const response = await request('https://api.sendgrid.com/v3/marketing/field_definitions')
  const data: APIData = response.data as APIData
  const customFields: CustomField[] = data.custom_fields as CustomField[]
  return customFields.map(
    // Strip out other fields provided by the API and return only what we need
    ({ id, name }: CustomField): CustomField => {
      return { id, name }
    }
  )
}

// Check if a custom field key in the Segment payload is a valid Sendgrid custom field name or ID for in the customer's
// account. If it is a valid ID, do nothing. If it is a valid name, use the corresponding ID instead. If it is neither,
// throw an error and give the user guidance.
const convertCustomFieldNamesToIds = (customFields: any, accountCustomFields: CustomField[]): any => {
  const field_ids = accountCustomFields.map((field) => field.id)
  const field_names = accountCustomFields.map((field) => field.name.toLowerCase())

  return Object.keys(customFields).reduce((result: any, key: string) => {
    let actualKey: string = key
    if (field_ids.includes(key)) {
      actualKey = key
    } else if (field_names.includes(key.toLowerCase())) {
      const matchingCustomField: CustomField = accountCustomFields.filter(
        (field: CustomField) => field.name.toLowerCase() === key.toLowerCase()
      )[0]
      actualKey = matchingCustomField.id
    } else {
      throw new Error(
        `Unknown custom field '${key}'. To see your defined custom fields, visit https://mc.sendgrid.com/custom-fields`
      )
    }
    result[actualKey] = customFields[key]
    return result
  }, {})
}

export const convertPayload = (payload: Payload, accountCustomFields: CustomField[]) => {
  const { state, primary_email, enable_batching, customFields, ...rest } = payload

  // If there are any custom fields, convert their key from sendgrid Name to sendgrid ID if needed
  const updatedCustomFields = customFields
    ? convertCustomFieldNamesToIds(customFields, accountCustomFields)
    : customFields

  return { ...rest, state_province_region: state, email: primary_email, custom_fields: updatedCustomFields }
}
