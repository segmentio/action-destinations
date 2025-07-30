import { ActionDefinition, InputField } from '@segment/actions-core'
import { Settings } from './generated-types'

const batch_size_column_name: InputField = {
  label: 'Batch Size Column Name',
  description:
    'Specify the column name to store the batch size when the event is sent to SFTP. Leave blank if no column is required',
  type: 'string',
  required: false,
  disabledInputMethods: ['variable', 'function', 'enrichment'],
  default: 'batch_size'
}

const audience_action_column_name: InputField = {
  label: 'Audience Action Column Name',
  description:
    'Name of the column that will contain the action for the audience. true if the user is in the audience, false if not.',
  type: 'string',
  required: false,
  disabledInputMethods: ['variable', 'function', 'enrichment'],
  default: 'audience_action'
}

const traits_or_props: InputField = {
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
}
const computation_key: InputField = {
  label: 'Audience_Key - Hidden Field',
  description: 'Field used to retrieve Audience Key',
  type: 'string',
  required: false,
  unsafe_hidden: true,
  default: { '@path': '$.context.personas.computation_key' }
}

const enable_batching: InputField = {
  type: 'boolean',
  label: 'Enable Batching',
  description: 'Enable Batching Hidden Field',
  unsafe_hidden: false,
  required: true,
  default: true
}

const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: true,
  default: 100_000,
  minimum: 1,
  maximum: 100_000
}

const sftp_folder_path: InputField = {
  label: 'Folder Path',
  description:
    'Path within the SFTP server to upload the files to. This path must exist and all subfolders must be pre-created.',
  type: 'string',
  required: true,
  default: { '@template': '/' }
}

const filename_prefix: InputField = {
  label: 'Filename prefix',
  description: `Prefix to prepend to the name of the uploaded file. Timestamp will be appended to the filename.`,
  type: 'string',
  required: true
}

const delimiter: InputField = {
  label: 'Delimiter',
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
}

const file_extension: InputField = {
  label: 'File Extension',
  description: `File extension for the uploaded file.`,
  type: 'string',
  required: true,
  choices: [
    { label: 'csv', value: 'csv' },
    { label: 'txt', value: 'txt' },
    { label: 'tsv', value: 'tsv' },
    { label: 'psv', value: 'psv' }
  ],
  default: 'csv'
}

const audienceFields = {
  audience_action_column_name,
  traits_or_props,
  computation_key
}

const columnsWithDefaultMappings: InputField = {
  label: 'Columns',
  description: `Column write to the SFTP CSV file.`,
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
}

const columnsNoDefaultMappings: InputField = {
  label: 'Columns',
  description: `Choose columns to write to the file sent to SFTP`,
  type: 'object',
  defaultObjectUI: 'keyvalue',
  required: true,
  additionalProperties: true
}

export const commonFields: ActionDefinition<Settings>['fields'] = {
  columns: columnsWithDefaultMappings,
  filename_prefix,
  file_extension,
  delimiter,
  sftp_folder_path,
  enable_batching,
  batch_size,
  batch_size_column_name,
  ...audienceFields
}

export const baseFields: ActionDefinition<Settings>['fields'] = {
  columns: columnsNoDefaultMappings,
  filename_prefix,
  file_extension,
  delimiter,
  sftp_folder_path,
  enable_batching,
  batch_size,
  batch_size_column_name
}
