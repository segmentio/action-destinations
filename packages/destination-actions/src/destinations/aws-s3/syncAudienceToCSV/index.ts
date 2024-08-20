import type { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { generateFile, validate } from '../operations'
import { S3CSVClient } from './s3'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
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
        audience_name: {
          label: 'Audience Name column',
          description: 'Name of column for the Audience Name',
          type: 'string'
        },
        audience_id: {
          label: 'Audience ID column',
          description: 'Name of column for the Audience ID',
          type: 'string'
        },
        audience_action: {
          label: 'Audience Action column',
          description:
            'Indicates if the user has been added or removed from the Audience. true = added, false = removed.',
          type: 'string'
        },
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
        }
      },
      default: {
        audience_name: 'audience_name',
        audience_id: 'audience_id',
        audience_action: 'audience_action',
        email: 'email',
        user_id: 'user_id',
        anonymous_id: 'anonymous_id',
        timestamp: 'timestamp',
        message_id: 'message_id',
        space_id: 'space_id',
        integrations_object: 'integrations_object',
        properties_or_traits: 'properties_or_traits'
      }
    },
    audienceName: {
      label: 'Audience Name Hidden Field',
      description: 'Audience Name Hidden Field',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    audienceId: {
      label: 'Audience ID Hidden Field',
      description: 'Audience ID Hidden Field',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_id' }
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
    spaceId: {
      label: 'Space ID Hidden Field',
      description: 'Space ID Hidden Field',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.space_id' }
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
    computation_class: {
      label: 'Segment Audience Computation Class',
      description:
        "Hidden field used to verify that the payload is generated by an Audience. Payloads not containing computation_class = 'audience' will be dropped before the perform() fuction call.",
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_class' },
      choices: [{ label: 'Audience', value: 'audience' }]
    }
  },

  perform: async (_, { payload, settings, audienceSettings }) => {
    const payloads = [payload, payload, payload]
    return processData(payloads, settings, audienceSettings)
  },
  performBatch: (_, { payload, settings, audienceSettings }) => {
    return processData(payload, settings, audienceSettings)
  }
}

async function processData(payloads: Payload[], settings: Settings, audienceSettings?: AudienceSettings) {
  validate(payloads, audienceSettings as AudienceSettings)
  const fileContent = generateFile(payloads, audienceSettings as AudienceSettings)
  const s3Client = new S3CSVClient(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id)
  await s3Client.uploadS3(settings, audienceSettings as AudienceSettings, fileContent, payloads[0].audienceName)
}

export default action
