import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import { generateFile } from '../operations'
import { SFTP_MIN_RECORD_COUNT } from '../properties'
import { Client as ClientSFTP, uploadSFTP, validateSFTP } from './sftp'

import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import type { Settings } from '../generated-types'
import type { ExecuteInputRaw, ProcessDataInput, RawData } from '../operations'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync to SFTP',
  description: 'Syncs Segment event data to SFTP.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    sftp_host: {
      label: 'SFTP Host',
      description: 'The hostname or IP address of the SFTP server',
      type: 'string',
      required: true
    },
    sftp_port: {
      label: 'SFTP Port',
      description: 'The port number for the SFTP connection',
      type: 'number',
      required: false,
      default: 22
    },
    sftp_username: {
      label: 'Username',
      description: 'User credentials for establishing an SFTP connection',
      type: 'string',
      required: true
    },
    sftp_password: {
      label: 'Password',
      description: 'User credentials for establishing an SFTP connection',
      type: 'password',
      required: true
    },
    sftp_folder_path: {
      label: 'Folder Path',
      description:
        'Path within the SFTP server to upload the files to. This path must exist and all subfolders must be pre-created.',
      type: 'string',
      required: true,
      default: { '@template': '/uploads/' },
      format: 'uri-reference'
    },
    audience_key: {
      label: 'Audience Key',
      description:
        'Unique ID that identifies members of an audience. A typical audience key might be client customer IDs, email addresses, or phone numbers.',
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
    delimiter: {
      label: 'Delimiter',
      description: `Character used to separate tokens in the resulting file.`,
      type: 'string',
      required: true,
      default: ','
    },
    filename: {
      label: 'Filename',
      description: `Name of the CSV file to upload via SFTP. For multiple subscriptions, make sure to use a unique filename for each subscription.`,
      type: 'string',
      required: true,
      default: { '@template': '{{properties.audience_key}}_audience.csv' }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'Receive events in a batch payload. This is recommended for SFTP uploads.',
      required: true,
      unsafe_hidden: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      unsafe_hidden: true,
      default: 50000
    }
  },
  perform: async (
    request,
    { payload, features, rawData, subscriptionMetadata }: ExecuteInputRaw<Settings, Payload, RawData>
  ) => {
    return processData(
      {
        request,
        payloads: [payload],
        features,
        rawData: rawData ? [rawData] : []
      },
      subscriptionMetadata
    )
  },
  performBatch: (
    request,
    { payload, features, rawData, subscriptionMetadata }: ExecuteInputRaw<Settings, Payload[], RawData[]>
  ) => {
    return processData(
      {
        request,
        payloads: payload,
        features,
        rawData
      },
      subscriptionMetadata
    )
  }
}

async function processData(input: ProcessDataInput<Payload>, _subscriptionMetadata?: SubscriptionMetadata) {
  if (input.payloads.length < SFTP_MIN_RECORD_COUNT) {
    throw new PayloadValidationError(
      `Received payload count below minimum threshold. Expected: >=${SFTP_MIN_RECORD_COUNT} actual: ${input.payloads.length}`
    )
  }

  validateSFTP(input.payloads[0])

  const { filename, fileContents } = generateFile(input.payloads)

  const sftpClient = new ClientSFTP()
  return uploadSFTP(sftpClient, input.payloads[0], filename as string, fileContents)
}

export default action
