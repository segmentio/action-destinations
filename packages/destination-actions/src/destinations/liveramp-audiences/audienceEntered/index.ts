import { ActionDefinition, InvalidAuthenticationError, RequestClient } from '@segment/actions-core'
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
    filename: {
      label: 'Filename',
      description: `Name of the CSV file to upload for LiveRamp ingestion.`,
      type: 'string',
      required: true,
      default: { '@template': '{{properties.audience_key}}_PII_{{receivedAt}}.csv' }
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
      default: 100000
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
  // STRATCONN-2584: error if less than 25 elements in payload
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
