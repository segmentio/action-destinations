import { ActionDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  columns: {
    label: 'Columns',
    description: `Column write to the S3 CSV file.`,
    type: 'object',
    defaultObjectUI: 'keyvalue',
    required: true,
    additionalProperties: true,
    properties: {
      event_name: {
        label: 'Event Name',
        description: 'Name of the event.',
        type: 'string'
      },
      event_type: {
        label: 'Event Type',
        description: 'The type of event',
        type: 'string'
      },
      user_id: {
        label: 'User ID',
        description: 'User ID',
        type: 'string'
      },
      anonymous_id: {
        label: 'Anonymous ID',
        description: 'Anonymous ID',
        type: 'string'
      },
      email: {
        label: 'Email',
        description: 'Email address',
        type: 'string'
      },
      properties: {
        label: 'Properties',
        description: 'Properties of the event',
        type: 'object'
      },
      traits: {
        label: 'Traits',
        description: 'User traits',
        type: 'object'
      },
      context: {
        label: 'Context',
        description: 'Context of the event',
        type: 'object'
      },
      timestamp: {
        label: 'Timestamp',
        description: 'Timestamp of the event',
        type: 'string'
      },
      message_id: {
        label: 'Message ID',
        description: 'Name of column for the unique identifier for the message.',
        type: 'string'
      },
      integrations: {
        label: 'Integrations Object',
        description:
          'Name of column for the Integration Object. This contains JSON details of which destinations the event was synced to by Segment',
        type: 'object'
      },
      audience_name: {
        label: 'Audience Name',
        description: 'Name of the audience',
        type: 'string'
      },
      audience_id: {
        label: 'Audience ID',
        description: 'ID of the audience',
        type: 'string'
      },
      audience_space_id: {
        label: 'Audience Space ID',
        description: 'ID of the Engage Space where the Audience was generated',
        type: 'string'
      }
    },
    default: {
      event_name: {
        '@path': '$.event'
      },
      event_type: {
        '@path': '$.type'
      },
      user_id: {
        '@path': '$.userId'
      },
      anonymous_id: {
        '@path': '$.anonymousId'
      },
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      },
      properties: {
        '@path': '$.properties'
      },
      traits: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.context.traits' }
        }
      },
      context: {
        '@path': '$.context'
      },
      timestamp: {
        '@path': '$.timestamp'
      },
      message_id: {
        '@path': '$.messageId'
      },
      integrations: {
        '@path': '$.integrations'
      },
      audience_name: {
        '@path': '$.context.personas.computation_key'
      },
      audience_id: {
        '@path': '$.context.personas.computation_id'
      },
      audience_space_id: {
        '@path': '$.context.personas.space_id'
      }
    }
  },
  audience_action_column_name: {
    label: 'Audience Action Column Name',
    description:
      'Name of the column that will contain the action for the audience. true if the user is in the audience, false if not.',
    type: 'string',
    required: false,
    disabledInputMethods: ['variable', 'function', 'enrichment'],
    default: 'audience_action'
  },
  batch_size_column_name: {
    label: 'Batch Size Column Name',
    description:
      'Specify the column name to store the batch size when the event is sent to S3. Leave blank if no column is required',
    type: 'string',
    required: false,
    disabledInputMethods: ['variable', 'function', 'enrichment'],
    default: 'batch_size'
  },
  traits_or_props: {
    label: 'Traits or Props - Hidden Field',
    description: 'Field used to retrieve Audience value',
    type: 'object',
    required: false,
    unsafe_hidden: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties' },
        then: { '@path': '$.properties' },
        else: { '@path': '$.traits' }
      }
    }
  },
  computation_key: {
    label: 'Audience_Key - Hidden Field',
    description: 'Field used to retrieve Audience Key',
    type: 'string',
    required: false,
    unsafe_hidden: true,
    default: { '@path': '$.context.personas.computation_key' }
  },
  enable_batching: {
    type: 'boolean',
    label: 'Enable Batching',
    description: 'Enable Batching Hidden Field',
    unsafe_hidden: false,
    required: true,
    default: true
  },
  batch_size: {
    label: 'Batch Size',
    description:
      'Maximum number of events to include in each batch. Actual batch sizes may be lower. Max batch size is 10000.',
    type: 'number',
    required: false,
    default: 5000
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
