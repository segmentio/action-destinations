import { ActionDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  columns: {
    label: 'Columns',
    description: `Column names to write to S3 CSV file.`,
    type: 'object',
    defaultObjectUI: 'object',
    required: true,
    additionalProperties: false,
    properties: {
      user_id_header: {
        label: 'User ID column',
        description: 'Name of column for user ID',
        type: 'string'
      },
      anonymous_id_header: {
        label: 'Anonymous ID column',
        description: 'Name of column for anonymous ID',
        type: 'string'
      },
      timestamp_header: {
        label: 'Timestamp',
        description: 'Name of column for timestamp for when the user was added or removed from the Audience',
        type: 'string'
      },
      message_id_header: {
        label: 'Message ID',
        description: 'Name of column for the unique identifier for the message.',
        type: 'string'
      },
      integrations_object_header: {
        label: 'Integrations Object',
        description:
          'Name of column for the Integration Object. This contains JSON details of which destinations the event was synced to by Segment',
        type: 'string'
      },
      all_event_properties_header: {
        label: 'All Event Properties',
        description: 'Name of column for the track() properties.',
        type: 'string'
      },
      all_user_traits_header: {
        label: 'All User Traits',
        description: 'Name of column for the track() or identify() user traits.',
        type: 'string'
      },
      event_name_header: {
        label: 'Event Name',
        description: 'Name of the event.',
        type: 'string'
      },
      event_type_header: {
        label: 'Event Type',
        description: 'The type of event',
        type: 'string'
      },
      context_header: {
        label: 'Context',
        description: 'Name of column for the context object.',
        type: 'string'
      }
    },
    default: {
      user_id_header: 'user_id',
      anonymous_id_header: 'anonymous_id',
      timestamp_header: 'timestamp',
      message_id_header: 'message_id',
      integrations_object_header: 'integrations_object',
      space_id_header: 'space_id',
      all_event_properties_header: 'all_event_properties',
      all_user_traits_header: 'all_user_traits',
      event_name_header: 'event_name',
      event_type_header: 'event_type',
      context_header: 'context'
    }
  },
  userId: {
    label: 'User ID Hidden Field',
    description: 'User ID Hidden Field',
    type: 'string',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.userId' }
  },
  anonymousId: {
    label: 'Anonymous ID Hidden Field',
    description: 'Anonymous ID Hidden Field',
    type: 'string',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.anonymousId' }
  },
  timestamp: {
    label: 'Timestamp Hidden Field',
    description: 'Timestamp Hidden Field',
    type: 'datetime',
    required: true,
    unsafe_hidden: true,
    default: { '@path': '$.timestamp' }
  },
  messageId: {
    label: 'Message ID Hidden Field',
    description: 'Message ID Hidden Field',
    type: 'string',
    required: true,
    unsafe_hidden: true,
    default: { '@path': '$.messageId' }
  },
  integrationsObject: {
    label: 'Integrations Object Hidden Field',
    description: 'Integrations Object Hidden Field',
    type: 'object',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.integrations' }
  },
  all_event_properties: {
    label: 'All Event Properties Hidden Field',
    description: 'Properties Hidden Field',
    type: 'object',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.properties' }
  },
  all_user_traits: {
    label: 'All User Traits Hidden Field',
    description: 'All User Traits Hidden Field',
    type: 'object',
    required: false,
    unsafe_hidden: true,
    default: {
      '@if': {
        exists: { '@path': '$.traits' },
        then: { '@path': '$.traits' },
        else: { '@path': '$.context.traits' }
      }
    }
  },
  context: {
    label: 'Context Hidden Field',
    description: 'Context Hidden Field',
    type: 'object',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.context' }
  },
  eventProperties: {
    label: 'Event Properties',
    description: 'The properties of the event. Each item will be written to a separate column.',
    type: 'object',
    required: false,
    disabledInputMethods: ['enrichment', 'function', 'variable'],
    defaultObjectUI: 'keyvalue:only'
  },
  userTraits: {
    type: 'object',
    label: 'User Traits',
    description: 'The properties of the user. Each item will be written to a separate column.',
    required: false,
    disabledInputMethods: ['enrichment', 'function', 'variable'],
    defaultObjectUI: 'keyvalue:only'
  },
  eventName: {
    label: 'Event Name Hidden Field',
    description: 'Event Name Hidden Field.',
    type: 'string',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.event' }
  },
  eventType: {
    label: 'Event Type Hidden Field',
    description: 'Event Type Hidden Field',
    type: 'string',
    unsafe_hidden: true,
    required: true,
    default: { '@path': '$.type' }
  },
  enable_batching: {
    type: 'boolean',
    label: 'Enable Batching',
    description: 'Enable Batching Hidden Field',
    unsafe_hidden: true,
    required: true,
    default: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    unsafe_hidden: true,
    required: false,
    default: 25000
  },
  s3_aws_folder_name: {
    label: 'AWS Subfolder Name',
    description:
      'Name of the S3 Subfolder where the files will be uploaded to. e.g. segmentdata/ or segmentdata/audiences/',
    type: 'string',
    required: false
  },
  filename_prefix: {
    label: 'Filename prefix',
    description: `Prefix to append to the name of the uploaded file.`,
    type: 'string',
    required: false
  },
  delimiter: {
    label: 'Delimeter',
    description: `Character used to separate tokens in the resulting file.`,
    type: 'string',
    required: true,
    disabledInputMethods: ['enrichment', 'function', 'variable'],
    choices: [
      { label: 'comma', value: ',' },
      { label: 'pipe', value: '|' },
      { label: 'tab', value: 'tab' },
      { label: 'semicolon', value: ';' },
      { label: 'colon', value: ':' }
    ],
    default: ','
  },
  file_extension: {
    label: 'File Extension',
    description: `File extension for the uploaded file.`,
    type: 'string',
    required: true,
    choices: [
      { label: 'csv', value: 'csv' },
      { label: 'txt', value: 'txt' }
    ],
    default: 'csv'
  }
}

export const audienceOnlyFields: ActionDefinition<Settings>['fields'] = {
  audienceColumns: {
    label: 'Columns',
    description: `Column names to write to S3 CSV file.`,
    type: 'object',
    defaultObjectUI: 'object',
    required: true,
    additionalProperties: false,
    properties: {
      audience_name_header: {
        label: 'Audience Name column',
        description: 'Name of column for audience name',
        type: 'string'
      },
      audience_id_header: {
        label: 'Audience ID column',
        description: 'Name of column for audience ID',
        type: 'string'
      },
      space_id_header: {
        label: 'Space ID',
        description: 'Name of column for the unique identifier for the Segment Engage Space that generated the event.',
        type: 'string'
      },
      audience_action_header: {
        label: 'Audience Action',
        description:
          'true indicates a user being added to the audience, false indicates a user being removed from the audience.',
        type: 'string'
      }
    },
    default: {
      audience_name: 'audience_name',
      audience_id: 'audience_id',
      space_id: 'space_id',
      audience_action: 'audience_action'
    }
  },
  spaceId: {
    label: 'Space ID Hidden Field',
    description: 'Space ID Hidden Field',
    type: 'string',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.context.personas.space_id' }
  },
  audienceName: {
    label: 'Audience Name Hidden Field',
    description: 'Audience Name Hidden Field',
    type: 'string',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.context.personas.computation_key' }
  },
  audienceId: {
    label: 'Audience ID Hidden Field',
    description: 'Audience ID Hidden Field',
    type: 'string',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.context.personas.computation_id' }
  }
}
