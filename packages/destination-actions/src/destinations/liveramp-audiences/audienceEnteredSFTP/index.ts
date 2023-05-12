import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { generateFile } from '../operations'
import { uploadSFTP, validateSFTP } from './sftp'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered (SFTP)',
  description: "Uploads audience membership data file to LiveRamp's SFTP server for ingestion.",
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
    sftp_username: {
      label: 'Username',
      description: 'User credentials for establishing an SFTP connection with LiveRamp.',
      required: true,
      type: 'string'
    },
    sftp_password: {
      label: 'Password',
      description: 'User credentials for establishing an SFTP connection with LiveRamp.',
      required: true,
      type: 'password'
    },
    sftp_folder_path: {
      label: 'Folder Path',
      description: 'Path within the SFTP server to upload the files to.',
      required: true,
      type: 'string',
      default: { '@template': '/uploads/{{properties.audience_key}}/' }
    }
  },
  perform: async (_request, { payload }) => {
    return processData([payload])
  },
  performBatch: (_request, { payload }) => {
    return processData(payload)
  }
}

async function processData(payloads: Payload[]) {
  // STRATCONN-2584: error if less than 25 elements in payload
  validateSFTP(payloads[0])

  const { filename, fileContent } = generateFile(payloads)

  return await uploadSFTP(payloads[0], filename, fileContent)
}

export default action
