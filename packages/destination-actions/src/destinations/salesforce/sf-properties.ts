import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { IntegrationError } from '@segment/actions-core'

export const operation: InputField = {
  label: 'Operation',
  description: 'Operation',
  type: 'string',
  required: true,
  choices: [
    { label: 'Create', value: 'create' },
    { label: 'Update', value: 'update' },
    { label: 'Upsert', value: 'upsert' }
  ]
}

export const traits: InputField = {
  label: 'Traits',
  description: 'Traits',
  type: 'object'
}

export const custom_fields: InputField = {
  label: 'Other Fields',
  description: `
  Additional fields to send to Salesforce. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.

  This can include standard or custom fields. Custom fields must be predefined in your Salesforce account and the API field name should have __c appended.
  `,
  type: 'object'
}

interface Payload {
  operation?: string
  traits?: object
}

export const validateLookup = (payload: Payload) => {
  if (payload.operation === 'update' || payload.operation === 'upsert') {
    if (!payload.traits) {
      throw new IntegrationError(
        'Undefined lookup traits for update or upsert operation',
        'Misconfigured Required Field',
        400
      )
    }
  }
}
