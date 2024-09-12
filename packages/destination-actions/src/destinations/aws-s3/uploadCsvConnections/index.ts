import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { generateFile, validate } from '../operations'
import { S3CSVClient } from './s3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upload CSV',
  description: 'Uploads audience membership data to a CSV file in S3.',
  fields: {
    columns: {
      label: 'Columns',
      description: `Column names to write to S3 CSV file.`,
      type: 'object',
      defaultObjectUI: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        email: {
          label: 'Email column',
          description: 'Name of column for email address',
          type: 'string'
        },
        user_id: {
          label: 'User ID column',
          description: 'Name of column for user ID',
          type: 'string'
        },
        anonymous_id: {
          label: 'Anonymous ID column',
          description: 'Name of column for anonymous ID',
          type: 'string'
        },
        timestamp: {
          label: 'Timestamp',
          description: 'Name of column for timestamp for when the user was added or removed from the Audience',
          type: 'string'
        },
        message_id: {
          label: 'Message ID',
          description: 'Name of column for the unique identifier for the message.',
          type: 'string'
        },
        space_id: {
          label: 'Space ID',
          description:
            'Name of column for the unique identifier for the Segment Engage Space that generated the event.',
          type: 'string'
        },
        integrations_object: {
          label: 'Integrations Object',
          description:
            'Name of column for the Integration Object. This contains JSON details of which destinations the event was synced to by Segment',
          type: 'string'
        },
        properties_or_traits: {
          label: 'Properties or Traits',
          description:
            'Name of column for properties and traits. This data contains the entire properties object from a track() call or the traits object from an identify() call emitted from Engage when a user is added to or removed from an Audience',
          type: 'string'
        },
        eventName: {
          label: 'Event Name',
          description: 'Name of the event.',
          type: 'string'
        },
        eventType: {
          label: 'Event Type',
          description: 'The type of event',
          type: 'string'
        }
      },
      default: {
        email: 'email',
        user_id: 'user_id',
        anonymous_id: 'anonymous_id',
        timestamp: 'timestamp',
        message_id: 'message_id',
        integrations_object: 'integrations_object',
        properties_or_traits: 'properties_or_traits',
        eventName: 'eventName',
        eventType: 'eventType'
      }
    },
    email: {
      label: 'Email Hidden Field',
      description: 'Email Hidden Field',
      type: 'string',
      required: false,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
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
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.integrations' }
    },
    propertiesOrTraits: {
      label: 'Properties or Traits Hidden Field',
      description: 'Properties or Traits Hidden Field',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    context: {
      label: 'Context Hidden Field',
      description: 'Context Hidden Field',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context' }
    },
    eventProperties: {
      label: 'Event Properties',
      description: 'Event-specific properties that can be included in emails triggered by this event.',
      type: 'object',
      required: false,
      disabledInputMethods: ['enrichment', 'function', 'variable'],
      defaultObjectUI: 'keyvalue:only'
      // default: { '@path': '$.properties' }
    },
    userTraits: {
      type: 'object',
      label: 'User Traits',
      description: 'The properties of the user',
      required: false,
      disabledInputMethods: ['enrichment', 'function', 'variable'],
      defaultObjectUI: 'keyvalue:only'
      // default: { '@path': '$.traits' }
    },
    eventName: {
      label: 'Event Name',
      description: 'Name of the event.',
      type: 'string',
      required: false,
      default: { '@path': '$.event' }
    },
    eventType: {
      label: 'Event Type',
      description: 'The type of event',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: { '@path': '$.type' }
    },
    additional_identifiers_and_traits_columns: {
      label: 'Additional Identifier and Trait Columns',
      description:
        'Additional user identifiers and traits to include as separate columns in the CSV file. Each item should contain a key and a value. The key is the trait or identifier name from the payload, and the value is the column name to be written to the CSV file.',
      type: 'object',
      required: false,
      disabledInputMethods: ['enrichment', 'function', 'variable'],
      defaultObjectUI: 'keyvalue:only'
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'Receive events in a batch payload. This is required for LiveRamp audiences ingestion.',
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
    filename: {
      label: 'Filename prefix',
      description: `Prefix to append to the name of the uploaded file. A lower cased audience name and timestamp will be appended by default to the filename to ensure uniqueness.
                      Format: <PREFIX>_<AUDIENCE NAME>_<TIMESTAMP>.csv`,
      type: 'string',
      required: false
    },
    delimiter: {
      label: 'Delimeter',
      description: `Character used to separate tokens in the resulting file.`,
      type: 'string',
      required: true,
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
  },

  perform: async (_, { payload, settings }) => {
    // const payloads = [payload, payload, payload]
    // return processData(payloads, settings)
    return processData([payload], settings)
  },
  performBatch: (_, { payload, settings }) => {
    return processData(payload, settings)
  }
}

async function processData(payloads: Payload[], settings: Settings) {
  validate(payloads)
  console.log('processData payloads', payloads)
  let isPersonasExist = false
  if (payloads[0].context && payloads[0].context.personas) {
    isPersonasExist = true
  }
  const fileContent = generateFile(payloads, isPersonasExist)
  const s3Client = new S3CSVClient(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id)
  await s3Client.uploadS3(
    settings,
    fileContent,
    payloads[0]?.filename ?? '',
    payloads[0]?.s3_aws_folder_name ?? '',
    payloads[0]?.file_extension ?? '.csv'
  )
}

export default action
