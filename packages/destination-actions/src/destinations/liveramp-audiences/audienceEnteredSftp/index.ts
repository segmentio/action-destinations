import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { uploadSFTP, validateSFTP, Client as ClientSFTP } from './sftp'
import { generateFile } from '../operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered (SFTP)',
  description: 'Uploads audience membership data to a file through SFTP for LiveRamp ingestion.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    sftp_username: {
      label: 'Username',
      description: 'User credentials for establishing an SFTP connection with LiveRamp.',
      type: 'string'
    },
    sftp_password: {
      label: 'Password',
      description: 'User credentials for establishing an SFTP connection with LiveRamp.',
      type: 'password'
    },
    sftp_folder_path: {
      label: 'Folder Path',
      description:
        'Path within the LiveRamp SFTP server to upload the files to. This path must exist and all subfolders must be pre-created.',
      type: 'string',
      default: '/uploads/audience_name/',
      format: 'uri-reference'
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
      default: 50000
    }
  },
  perform: async (_, { payload }) => {
    return processData([payload])
  },
  performBatch: (_, { payload }) => {
    return processData(payload)
  }
}

async function processData(payloads: Payload[]) {
  const LIVERAMP_MIN_RECORD_COUNT = 25
  if (payloads.length < LIVERAMP_MIN_RECORD_COUNT) {
    throw new PayloadValidationError(
      `received payload count below LiveRamp's ingestion limits. expected: >=${LIVERAMP_MIN_RECORD_COUNT} actual: ${payloads.length}`
    )
  }

  validateSFTP(payloads[0])

  const { filename, fileContent } = generateFile(payloads)

  const sftpClient = new ClientSFTP()
  return uploadSFTP(sftpClient, payloads[0], filename, fileContent)
}

export default action
