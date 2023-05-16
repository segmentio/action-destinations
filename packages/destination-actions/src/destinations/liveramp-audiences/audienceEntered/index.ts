import { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { uploadS3, validateS3 } from './s3'
import { uploadSFTP, validateSFTP } from './sftp'
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
      validateS3(payloads[0])
      break
    case 'SFTP':
      validateSFTP(payloads[0])
      break
    default:
      throw new InvalidPayloadError(`Unexpected upload mode: ${settings.upload_mode}`)
  }

  const { filename, fileContent } = generateFile(payloads)

  switch (settings.upload_mode) {
    case 'S3':
      return await uploadS3(payloads[0], filename, fileContent, request)
    case 'SFTP':
      return await uploadSFTP(payloads[0], filename, fileContent)
  }
}

export default action
