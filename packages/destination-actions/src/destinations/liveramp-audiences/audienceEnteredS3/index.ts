import { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { generateFile } from '../operations'
import { uploadS3, validateS3 } from './s3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered (S3)',
  description: 'Uploads audience membership data file to an S3 bucket for LiveRamp ingestion.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    audience_key: {
      label: 'Audience Key',
      description: 'Identifies the user within the entered audience.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    identifier_data: {
      label: 'Identifier Data',
      description: `Additional data pertaining to the user.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only',
      default: { '@path': '$.context.traits' }
    },
    delimiter: {
      label: 'Delimeter',
      description: `Character used to separate tokens in the resulting file.`,
      type: 'string',
      required: true,
      default: ','
    },
    audience_name: {
      label: 'Audience name',
      description: `Name of the audience the user has entered.`,
      type: 'string',
      required: true,
      default: { '@path': '$.properties.audience_key' }
    },
    received_at: {
      label: 'Received At',
      description: `Datetime at which the event was received. Used to disambiguate the resulting file.`,
      type: 'datetime',
      required: true,
      default: { '@path': '$.receivedAt' }
    },
    s3_aws_access_key: {
      label: 'AWS Access Key ID',
      description: 'IAM user credentials with write permissions to the S3 bucket.',
      type: 'string',
      placeholder: 'AK123456789EXAMPLE',
      required: true
    },
    s3_aws_secret_key: {
      label: 'AWS Secret Access Key',
      description: 'IAM user credentials with write permissions to the S3 bucket.',
      type: 'password',
      placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      required: true
    },
    s3_aws_bucket_name: {
      label: 'AWS Bucket Name',
      description: 'Name of the S3 bucket where the files will be uploaded to.',
      type: 'string',
      required: true
    },
    s3_aws_region: {
      label: 'AWS Region',
      description: 'Region where the S3 bucket is hosted.',
      type: 'string',
      placeholder: 'us-west-2',
      required: true
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
  // STRATCONN-2584: error if less than 25 elements in payload
  validateS3(payloads[0])

  const { filename, fileContent } = generateFile(payloads)

  return await uploadS3(payloads[0], filename, fileContent, request)
}

export default action
