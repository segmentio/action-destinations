import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { ExecuteInputRaw, ProcessDataInput, RawData } from '../operations'
import { generateFile } from '../operations'
import type { Payload } from './generated-types'
import { uploadS3, validateS3 } from './s3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upload CSV',
  description: 'Uploads audience membership data to a CSV file in S3.',
  fields: {
    iam_role_arn: {
      label: 'IAM Role ARN',
      description:
        'IAM role ARN with write permissions to the S3 bucket. Format: arn:aws:iam::account-id:role/role-name',
      type: 'string',
      required: true
    },
    s3_aws_bucket_name: {
      label: 'AWS Bucket Name',
      description: 'Name of the S3 bucket where the files will be uploaded to.',
      type: 'string'
    },
    s3_aws_folder_name: {
      label: 'AWS Subfolder Name',
      description:
        'Name of the S3 Subfolder where the files will be uploaded to. "/" must exist at the end of the folder name.',
      type: 'string'
    },
    s3_aws_region: {
      label: 'AWS Region (S3 only)',
      description: 'Region where the S3 bucket is hosted.',
      type: 'string'
    },
    is_audience: {
      type: 'boolean',
      label: 'Check if uploading audience data',
      description: 'Check if the data being uploaded is audience data. This is required for sending audiences to S3',
      required: true,
      default: false
    },
    identifier_data: {
      label: 'Identifier Data',
      description: `Additional data pertaining to the user to be written to the file.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only'
    },
    unhashed_identifier_data: {
      label: 'Hashable Identifier Data',
      description: `Additional data pertaining to the user to be hashed before written to the file. Use field name **phone_number** or **email** to apply LiveRamp's specific hashing rules.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only'
    },
    delimiter: {
      label: 'Delimeter',
      description: `Character used to separate tokens in the resulting file.`,
      type: 'string',
      required: true,
      default: ','
    },
    filename: {
      label: 'Filename',
      description: `Name of the CSV file to upload. If .csv is not included in the filename, it will be appended automatically.
      A timestamp will be appended to the filename to ensure uniqueness.`,
      type: 'string',
      required: true,
      default: { '@template': 'audience_{{context.personas.computation_key}}.csv' }
    },
    computation_key: {
      label: 'Segment Audience Key',
      description: 'A unique identifier assigned to a specific audience in Segment.',
      type: 'string',
      required: false,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Hidden field used to access traits or properties objects from Engage payloads.',
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
    computation_class: {
      label: 'Segment Audience Computation Class',
      description:
        "Hidden field used to verify that the payload is generated by an Audience. Payloads not containing computation_class = 'audience' will be dropped before the perform() fuction call.",
      type: 'string',
      required: false,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_class' },
      choices: [{ label: 'Audience', value: 'audience' }]
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
    }
  },
  perform: async (request, { payload, features, rawData }: ExecuteInputRaw<Settings, Payload, RawData>) => {
    return processData({
      request,
      payloads: [payload],
      features,
      rawData: rawData ? [rawData] : []
    })
  },
  performBatch: (request, { payload, features, rawData }: ExecuteInputRaw<Settings, Payload[], RawData[]>) => {
    return processData({
      request,
      payloads: payload,
      features,
      rawData
    })
  }
}

async function processData(input: ProcessDataInput<Payload>) {
  validateS3(input.payloads[0])
  const { filename, fileContents } = generateFile(input.payloads)
  console.log('Uploading to S3', input)
  return uploadS3(input.payloads[0], filename, fileContents)
}

export default action
