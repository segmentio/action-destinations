import { ActionDefinition, MultiStatusResponse, PayloadValidationError, JSONLikeObject } from '@segment/actions-core'
import { uploadSFTP, validateSFTP, Client as ClientSFTP } from './sftp'
import { generateFile } from '../operations'
import { sendEventToAWS } from '../awsClient'
import {
  LIVERAMP_MIN_RECORD_COUNT,
  LIVERAMP_LEGACY_FLOW_FLAG_NAME,
  LIVERAMP_ENABLE_COMPRESSION_FLAG_NAME
} from '../properties'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { RawData, ExecuteInputRaw, ProcessDataInput } from '../operations'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'

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
      label: 'LiveRamp Audience Key',
      description:
        'Unique ID that identifies members of an audience. A typical audience key might be client customer IDs, email addresses, or phone numbers. See more information on [LiveRamp Audience Key](https://docs.liveramp.com/connect/en/onboarding-terms-and-concepts.html#audience-key)',
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
      description: `Name of the CSV file to upload for LiveRamp ingestion. For multiple subscriptions, make sure to use a unique filename for each subscription.`,
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
  performBatch: async (
    request,
    { payload, features, rawData, subscriptionMetadata }: ExecuteInputRaw<Settings, Payload[], RawData[]>
  ) => {
    return await processData(
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

async function processData(
  input: ProcessDataInput<Payload>,
  subscriptionMetadata?: SubscriptionMetadata
): Promise<MultiStatusResponse> {
  if (input.payloads.length < LIVERAMP_MIN_RECORD_COUNT) {
    throw new PayloadValidationError(
      `received payload count below LiveRamp's ingestion limits. expected: >=${LIVERAMP_MIN_RECORD_COUNT} actual: ${input.payloads.length}`
    )
  }

  const multistatus = new MultiStatusResponse()

  validateSFTP(input.payloads[0])

  const { filename, fileContents } = generateFile(input.payloads)

  if (input.features && input.features[LIVERAMP_LEGACY_FLOW_FLAG_NAME] === true) {
    //------------
    // LEGACY FLOW
    // -----------
    const sftpClient = new ClientSFTP()
    try {
      await uploadSFTP(sftpClient, input.payloads[0], filename, fileContents)
      // Set success responses after successful upload
      for (let index = 0; index < input.payloads.length; index++) {
        multistatus.setSuccessResponseAtIndex(index, {
          status: 200,
          sent: input.payloads[index] as unknown as JSONLikeObject,
          body: 'Successfully uploaded file to SFTP'
        })
      }
      return multistatus
    } catch (error) {
      // Set error responses on failure
      for (let index = 0; index < input.payloads.length; index++) {
        multistatus.setErrorResponseAtIndex(index, {
          status: 500,
          errormessage: `Failed to upload file to SFTP: ${(error as Error).message}`
        })
      }
      return multistatus
    }
  } else {
    //------------
    // AWS FLOW
    // -----------
    const shouldEnableCompression = input.features && input.features[LIVERAMP_ENABLE_COMPRESSION_FLAG_NAME] === true

    try {
      await sendEventToAWS({
        audienceComputeId: input.rawData?.[0].context?.personas?.computation_id,
        uploadType: 'sftp',
        filename,
        fileContents,
        rowCount: input.payloads.length,
        destinationInstanceID: subscriptionMetadata?.destinationConfigId,
        subscriptionId: subscriptionMetadata?.actionConfigId,
        gzipCompressFile: shouldEnableCompression,
        sftpInfo: {
          sftpUsername: input.payloads[0].sftp_username,
          sftpPassword: input.payloads[0].sftp_password,
          sftpFolderPath: input.payloads[0].sftp_folder_path
        }
      })
      // Set success responses after successful AWS upload
      for (let index = 0; index < input.payloads.length; index++) {
        multistatus.setSuccessResponseAtIndex(index, {
          status: 200,
          sent: input.payloads[index] as unknown as JSONLikeObject,
          body: 'Successfully sent file to AWS for SFTP upload'
        })
      }
      return multistatus
    } catch (error) {
      // Set error responses on failure
      for (let index = 0; index < input.payloads.length; index++) {
        multistatus.setErrorResponseAtIndex(index, {
          status: 500,
          errormessage: `Failed to send file to AWS for SFTP upload: ${(error as Error).message}`
        })
      }
      return multistatus
    }
  }
}

export default action
