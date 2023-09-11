import { InputField } from '@segment/actions-core/destination-kit/types'

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

export const engage_space: InputField = {
  label: 'Profile Space',
  description:
    'The Profile Space to use for creating a record. *Note: This field shows list of internal sources associated with the Profile Space. Changes made to the Profile Space name in **Settings** will not reflect in this list unless the source associated with the Profile Space is renamed explicitly.*',
  type: 'string',
  required: true,
  dynamic: true
}

export const timestamp: InputField = {
  label: 'Timestamp',
  description:
    'Timestamp when the message itself took place as a ISO-8601 format date string. Defaults to current time if not provided.',
  type: 'string'
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'Name of the action that a user has performed.',
  type: 'string',
  required: true
}

export const properties: InputField = {
  label: 'Properties',
  description: 'Free-form dictionary of properties that describe the screen.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  additionalProperties: true
}
