import { InputField, RequestClient, IntegrationError } from '@segment/actions-core'
import { Payload } from './updateUserProfile/generated-types'
import { Settings } from './generated-types'

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

export const GLOBAL_ENDPOINT = 'https://api.sendgrid.com'
export const EU_ENDPOINT = 'https://api.eu.sendgrid.com'

export function getRegionalEndpoint(settings: Settings) {
  return settings?.endpoint ?? GLOBAL_ENDPOINT
}

// Fetch all custom field definitions for the account using the Sendgrid API
// https://docs.sendgrid.com/api-reference/custom-fields/get-all-field-definitions
export const fetchAccountCustomFields = async (request: RequestClient, settings: Settings): Promise<CustomField[]> => {
  const regionalEndpoint = getRegionalEndpoint(settings)
  const response = await request(`${regionalEndpoint}/v3/marketing/field_definitions`)
  const data: APIData = response.data as APIData
  const customFields: CustomField[] = data.custom_fields as CustomField[]

  // True if the SendGrid account does not have any defined custom fields
  if (customFields === undefined) {
    return []
  }

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
      throw new IntegrationError(
        `Unknown custom field '${key}'. To see your defined custom fields, visit https://mc.sendgrid.com/custom-fields`,
        'Invalid value',
        400
      )
    }
    result[actualKey] = customFields[key]
    return result
  }, {})
}

// This function transforms data types for values that the Sendgrid MC API does not accept (boolean, array, object) and
// transforms them into a type that is accepted
export const tranformValueToAcceptedDataType = (value: any): any => {
  // typeof for arrays is also 'object', so this branch will transform boolean, arrays, and objects
  if (typeof value === 'boolean' || typeof value === 'object') {
    return JSON.stringify(value)
  } else {
    return value
  }
}

const transformValuesToAcceptedDataTypes = (data: any): any => {
  const tranformedData: any = {}

  for (const property in data) {
    tranformedData[property] = tranformValueToAcceptedDataType(data[property])
  }

  return tranformedData
}

// Validate the payload of each contact
export const validatePayload = (payload: Payload) => {
  // Validate that 1 of the 4 identifier fields is included in the payload
  if (!payload.primary_email && !payload.phone_number_id && !payload.external_id && !payload.anonymous_id) {
    throw new IntegrationError(
      'Contact must have at least one identifying field included (email, phone_number_id, external_id, anonymous_id).',
      'Invalid value',
      400
    )
  }
}

export const convertPayload = (payload: Payload, accountCustomFields: CustomField[]) => {
  const { state, primary_email, enable_batching, customFields, ...rest } = payload

  // Validate that each contact payload is correct (i.e. contains 1 of the 4 identifier fields)
  validatePayload(payload)

  // If there are any custom fields, convert their key from sendgrid Name to sendgrid ID if needed
  const updatedCustomFields = customFields
    ? convertCustomFieldNamesToIds(customFields, accountCustomFields)
    : customFields

  return {
    ...rest,
    state_province_region: state,
    email: primary_email,
    // We only need to transform custom fields because reserved fields are types Sendgrid MC API accepts
    custom_fields: transformValuesToAcceptedDataTypes(updatedCustomFields)
  }
}
