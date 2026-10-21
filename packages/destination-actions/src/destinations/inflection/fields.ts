import type { ActionDefinition, InputField } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { ARRAY_HANDLING, OBJECT_HANDLING } from './constants'

export const messageId: InputField = {
  label: 'Message ID',
  description: 'The unique ID of the Segment event.',
  type: 'string',
  required: true,
  default: { '@path': '$.messageId' }
}

export const timestamp: InputField = {
  label: 'Timestamp',
  description: 'The timestamp of the event.',
  type: 'datetime',
  required: true,
  default: { '@path': '$.timestamp' }
}

export const anonymousId: InputField = {
  label: 'Anonymous ID',
  description: 'The Segment anonymous ID of the user.',
  type: 'string',
  default: { '@path': '$.anonymousId' }
}

export const userId: InputField = {
  label: 'User ID',
  description: 'The unique identifier of the user.',
  type: 'string',
  required: true,
  default: { '@path': '$.userId' }
}

export const groupId: InputField = {
  label: 'Group ID',
  description: 'The unique identifier of the group the user belongs to.',
  type: 'string',
  default: { '@path': '$.context.groupId' }
}

export const audienceDetails: InputField = {
  label: 'Audience Details',
  description:
    'Send audience membership as a regular boolean trait or property named after the audience. Engage audiences are sent automatically. For Reverse ETL, enter an Audience Name.',
  type: 'object',
  defaultObjectUI: 'object',
  additionalProperties: false,
  properties: {
    audienceName: {
      label: 'Audience Name',
      description:
        'The name of the trait or property to send. By default this is the Engage audience key, which is the snake_cased audience name. Enter a value to override it.',
      type: 'string'
    },
    audienceMembership: {
      label: 'Audience Membership',
      description:
        'Whether the user is in the audience. If you leave this unset, Segment uses the Engage membership, or the Sync Mode for Reverse ETL.',
      type: 'boolean'
    }
  },
  default: {
    audienceName: { '@path': '$.context.personas.computation_key' }
  }
}

export const engageAudienceKey: InputField = {
  label: 'Engage Audience Key',
  description: 'The key of the Engage audience. Used to avoid sending the audience twice when the name is overridden.',
  type: 'string',
  unsafe_hidden: true,
  default: { '@path': '$.context.personas.computation_key' }
}

export const syncMode: ActionDefinition<Settings>['syncMode'] = {
  label: 'Sync Mode',
  description: 'Specify how Segment should sync data to Inflection when connected to a database Source.',
  default: 'mirror',
  choices: [
    { label: 'Add - triggers when a row is added', value: 'add' },
    {
      label: 'Update - triggers when a row is updated',
      value: 'update'
    },
    {
      label: 'Upsert - triggers when a row is added or updated',
      value: 'upsert'
    },
    {
      label: 'Delete - triggers when a row is deleted',
      value: 'delete'
    },
    {
      label: 'Mirror - triggers when a row is added, updated, or deleted',
      value: 'mirror'
    }
  ]
}

export const nestedValueHandling: InputField = {
  label: 'Nested Value Handling',
  description: 'How to send objects and arrays nested inside the properties or traits.',
  type: 'object',
  defaultObjectUI: 'object',
  additionalProperties: false,
  properties: {
    objectHandling: {
      label: 'Object Handling',
      description:
        'Stringify sends the object as a JSON string. Flatten sends one field per key, named parent_key (for example address_city).',
      type: 'string',
      choices: [
        { label: 'Stringify as JSON', value: OBJECT_HANDLING.STRINGIFY },
        { label: 'Flatten into separate fields', value: OBJECT_HANDLING.FLATTEN }
      ],
      default: OBJECT_HANDLING.STRINGIFY
    },
    arrayHandling: {
      label: 'Array Handling',
      description:
        'Stringify sends the array as a JSON string. Flatten sends one field per item, named parent_0, parent_1. Join sends a single comma-separated string.',
      type: 'string',
      choices: [
        { label: 'Stringify as JSON', value: ARRAY_HANDLING.STRINGIFY },
        { label: 'Flatten into separate fields', value: ARRAY_HANDLING.FLATTEN },
        { label: 'Join into a comma-separated string', value: ARRAY_HANDLING.JOIN }
      ],
      default: ARRAY_HANDLING.STRINGIFY
    }
  },
  default: {
    objectHandling: OBJECT_HANDLING.STRINGIFY,
    arrayHandling: ARRAY_HANDLING.STRINGIFY
  }
}
