import {
  ActionDefinition,
  InvalidAuthenticationError,
  PayloadValidationError,
  RequestClient
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { uploadS3, validateS3 } from './s3'
import { uploadSFTP, validateSFTP, Client as ClientSFTP } from './sftp'
import { generateFile } from '../operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered',
  description: 'Uploads audience membership data to a file for LiveRamp ingestion.',
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
      default: 1000000
    }
  },
  perform: async (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  },
  performBatch: (request, { settings, payload }) => {
    return processData(request, settings, payload)
  }
}

async function processData(request: RequestClient, settings: Settings, payloads: Payload[]) {
  const LIVERAMP_MIN_RECORD_COUNT = 25
  if (payloads.length < LIVERAMP_MIN_RECORD_COUNT) {
    throw new PayloadValidationError(
      `received payload count below LiveRamp's ingestion limits. expected: >=${LIVERAMP_MIN_RECORD_COUNT} actual: ${payloads.length}`
    )
  }

  switch (settings.upload_mode) {
    case 'S3':
      validateS3(settings)
      break
    case 'SFTP':
      validateSFTP(settings)
      break
    default:
      throw new InvalidAuthenticationError(`Unexpected upload mode: ${settings.upload_mode}`)
  }

  const { filename, fileContent } = generateFile(payloads)

  switch (settings.upload_mode) {
    case 'S3':
      return uploadS3(settings, filename, fileContent, request)
    case 'SFTP': {
      const sftpClient = new ClientSFTP()
      return uploadSFTP(sftpClient, settings, filename, fileContent)
    }
  }
}

export default action
