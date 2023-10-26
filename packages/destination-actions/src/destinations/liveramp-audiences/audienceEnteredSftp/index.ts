import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import { uploadSFTP, validateSFTP, Client as ClientSFTP } from './sftp'
import { generateFile } from '../operations'
import { sendEventToAWS } from '../awsClient'
import { LIVERAMP_MIN_RECORD_COUNT, LIVERAMP_LEGACY_FLOW_FLAG_NAME } from '../properties'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { RawData, ExecuteInputRaw, ProcessDataInput } from '../operations'

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
      description: `Name of the CSV file to upload for LiveRamp ingestion.`,
      type: 'string',
      required: true,
      default: { '@template': '{{properties.audience_key}}_PII.csv' }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'Receive events in a batch payload. This is required for LiveRamp audiences ingestion.',
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
  if (input.payloads.length < LIVERAMP_MIN_RECORD_COUNT) {
    throw new PayloadValidationError(
      `received payload count below LiveRamp's ingestion limits. expected: >=${LIVERAMP_MIN_RECORD_COUNT} actual: ${input.payloads.length}`
    )
  }

  validateSFTP(input.payloads[0])

  const { filename, fileContents } = generateFile(input.payloads)

  if (input.features && input.features[LIVERAMP_LEGACY_FLOW_FLAG_NAME] === true) {
    //------------
    // LEGACY FLOW
    // -----------
    const sftpClient = new ClientSFTP()
    return uploadSFTP(sftpClient, input.payloads[0], filename, fileContents)
  } else {
    //------------
    // AWS FLOW
    // -----------
    return sendEventToAWS(input.request, {
      audienceComputeId: input.rawData?.[0].context?.personas?.computation_id,
      uploadType: 'sftp',
      filename,
      fileContents,
      sftpInfo: {
        sftpUsername: input.payloads[0].sftp_username,
        sftpPassword: input.payloads[0].sftp_password,
        sftpFolderPath: input.payloads[0].sftp_folder_path
      }
    })
  }
}

export default action
