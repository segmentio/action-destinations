import { InputField } from '@segment/actions-core/src/destination-kit/types'

export const user_id: InputField = {
  label: 'User ID',
  description: 'Unique identifier for the user in your database. A userId or an anonymousId is required.',
  type: 'string'
}

export const anonymous_id: InputField = {
  label: 'Anonymous ID',
  description:
    'A pseudo-unique substitute for a User ID, for cases when you don’t have an absolutely unique identifier. A userId or an anonymousId is required.',
  type: 'string'
}

export const group_id: InputField = {
  label: 'Group ID',
  description: 'The group or account ID a user is associated with.',
  type: 'string'
}

export const traits: InputField = {
  label: 'Traits',
  description: 'Free-form dictionary of traits that describe the user or group of users.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  additionalProperties: true
}
