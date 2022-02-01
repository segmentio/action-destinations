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

export const standard_fields: InputField = {
  label: 'Other Standard Fields',
  description:
    'Additional standard fields to send to Salesforce. On the left-hand side, input the Salesforce standard field name. On the right-hand side, map the Segment field that contains the value.',
  type: 'object'
}

export const custom_fields: InputField = {
  label: 'Custom Fields',
  description: `
  Custom fields to send to Salesforce. Fields must be predefined in your Salesforce account. 

  On the left-hand side, input the Salesforce field name with __c appended. On the right-hand side, map the Segment field that contains the value.
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
