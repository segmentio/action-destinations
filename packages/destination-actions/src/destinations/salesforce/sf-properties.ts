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

export const lookup_criteria: InputField = {
  label: 'Lookup Criteria',
  description: 'Which criteria to use for update/upsert lookups',
  required: true,
  type: 'string',
  choices: [
    { label: 'External ID', value: 'external_id' },
    { label: 'Trait', value: 'trait' },
    { label: 'Record ID', value: 'record_id' }
  ]
}

export const external_id_field: InputField = {
  label: 'External ID Field',
  description: 'External ID Field',
  type: 'string'
}

export const external_id_value: InputField = {
  label: 'External ID Value',
  description: 'External ID Value',
  type: 'string'
}

export const record_id: InputField = {
  label: 'Record ID',
  description: 'Record ID',
  type: 'string'
}

export const trait_field: InputField = {
  label: 'Trait Field',
  description: 'Trait Field',
  type: 'string'
}

export const trait_value: InputField = {
  label: 'Trait Value',
  description: 'Trait Value',
  type: 'string'
}

interface Payload {
  operation?: string
  lookup_criteria?: string
  external_id_field?: string
  external_id_value?: string
  trait_field?: string
  trait_value?: string
  record_id?: string
}

export const validateLookup = (payload: Payload) => {
  if (payload.operation === 'update' || payload.operation === 'upsert') {
    if (!payload.lookup_criteria) {
      throw new IntegrationError(
        'Undefined lookup criteria for update or upsert operation',
        'Misconfigured Required Field',
        400
      )
    }
  }

  if (payload.lookup_criteria === 'external_id') {
    if (payload.external_id_field === undefined) {
      throw new IntegrationError('Undefined external_id_field', 'Misconfigured Required Field', 400)
    }
    if (payload.external_id_value === undefined) {
      throw new IntegrationError('Undefined external_id_value', 'Misconfigured Required Field', 400)
    }
  }

  if (payload.lookup_criteria === 'trait') {
    if (payload.trait_field === undefined) {
      throw new IntegrationError('Undefined trait_field', 'Misconfigured Required Field', 400)
    }
    if (payload.trait_value === undefined) {
      throw new IntegrationError('Undefined trait_value', 'Misconfigured Required Field', 400)
    }
  }

  if (payload.lookup_criteria === 'record_id') {
    if (payload.record_id === undefined) {
      throw new IntegrationError('Undefined record_id', 'Misconfigured Required Field', 400)
    }
  }

  if (payload.operation === 'upsert' && payload.lookup_criteria === 'record_id') {
    throw new IntegrationError(
      'Invalid configuration, cannot use record_id with upsert',
      'Misconfigured Required Field',
      400
    )
  }
}
