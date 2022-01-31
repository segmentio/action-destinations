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
