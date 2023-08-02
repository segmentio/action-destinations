import { ActionDefinition, PayloadValidationError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { uploadS3, validateS3 } from './s3'
import { generateFile } from '../operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered (S3)',
  description: 'Uploads audience membership data to a file in S3 for LiveRamp ingestion.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    s3_aws_access_key: {
      label: 'AWS Access Key ID',
      description: 'IAM user credentials with write permissions to the S3 bucket.',
      type: 'string'
    },
    s3_aws_secret_key: {
      label: 'AWS Secret Access Key',
      description: 'IAM user credentials with write permissions to the S3 bucket.',
      type: 'password'
    },
    s3_aws_bucket_name: {
      label: 'AWS Bucket Name',
      description: 'Name of the S3 bucket where the files will be uploaded to.',
      type: 'string'
    },
    s3_aws_region: {
      label: 'AWS Region (S3 only)',
      description: 'Region where the S3 bucket is hosted.',
      type: 'string'
    },
    audience_key: {
      label: 'Audience Key',
      description: 'Identifies the user within the entered audience.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
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
      description: `Additional data pertaining to the user to be hashed before written to the file`,
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
      description: `Name of the CSV file to upload for LiveRamp ingestion.`,
      type: 'string',
      required: true,
      default: { '@template': '{{properties.audience_key}}_PII_{{timestamp}}.csv' }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'Receive events in a batch payload. This is required for LiveRamp audiences ingestion.',
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      default: 170000
    }
  },
  perform: async (request, { payload }) => {
    return processData(request, [payload])
  },
  performBatch: (request, { payload }) => {
    return processData(request, payload)
  }
}

async function processData(request: RequestClient, payloads: Payload[]) {
  const LIVERAMP_MIN_RECORD_COUNT = 25
  if (payloads.length < LIVERAMP_MIN_RECORD_COUNT) {
    throw new PayloadValidationError(
      `received payload count below LiveRamp's ingestion limits. expected: >=${LIVERAMP_MIN_RECORD_COUNT} actual: ${payloads.length}`
    )
  }

  validateS3(payloads[0])

  const { filename, fileContent } = generateFile(payloads)

  return uploadS3(payloads[0], filename, fileContent, request)
}

export default action
