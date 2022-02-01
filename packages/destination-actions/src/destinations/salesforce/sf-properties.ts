import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { IntegrationError } from '@segment/actions-core'

export const operation: InputField = {
  label: 'Operation',
  description:
    'The Salesforce operation performed. The operations available create, update or upsert Lead records in Salesforce.',
  type: 'string',
  required: true,
  choices: [
    { label: 'Create', value: 'create' },
    { label: 'Update', value: 'update' },
    { label: 'Upsert', value: 'upsert' }
  ]
}

export const traits: InputField = {
  label: 'Record Matchers',
  description: `The fields used to find Salesforce Lead records for updates. This is required if the Operation is Update or Upsert.

  Any field can function as a matcher, including Record ID, External IDs, standard fields and custom fields. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.
  
  If multiple records are found, no updates will be made. Please use fields that result in unique records.`,
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
