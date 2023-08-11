import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import receiveEvents from './receiveEvents/index'
import { Client, Client as ClientSFTP, testAuthSFTP } from './Utility/sftpCache'
import { InvalidAuthenticationError } from '@segment/actions-core'

Client

const mod = `
Last-Modified: 08.11.2023 11.39.21
`
//August 2023, refactor for S3Cache

/** Used in the quick setup dialog for Mapping */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'receiveEvents',
    mapping: {
      ...defaultValues(receiveEvents.fields),
      email: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'receiveEvents',
    mapping: {
      ...defaultValues(receiveEvents.fields),
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Acoustic S3TC',
  slug: 'actions-acoustic-s3tc',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      cacheType: {
        label: 'Use the S3 or SFTP Cache',
        description: 'Choose transport option, S3 is the default',
        type: 'string',
        required: true,
        default: 'S3',
        choices: [
          { value: 'S3', label: 'S3' },
          { value: 'SFTP', label: 'SFTP' }
        ]
      },
      fileNamePrefix: {
        label: 'File Name Prefix',
        description: `Prefix to all Stored File Names`,
        type: 'string',
        required: false,
        default: 'customer_org_'
      },
      s3_access_key: {
        label: 'S3 Access Key',
        description: 'Write permission to the S3 bucket.',
        type: 'string'
      },
      s3_secret: {
        label: 'S3 Secret',
        description: 'Write permission to the S3 bucket.',
        type: 'password'
      },
      s3_bucket: {
        label: 'S3 Bucket Access Point',
        description: 'An Access Point created as access to the S3 bucket.',
        default: 's3://arn:aws:s3:us-east-1:777957353822:accesspoint/tricklercache-access',
        type: 'string'
      },
      s3_region: {
        label: 'S3 Region',
        description: 'See S3 definition, should be eg: us-east-1, us-east-2',
        default: 'us-east-1',
        type: 'string'
      },
      sftp_user: {
        label: 'SFTP Userid credential',
        description: 'Acoustic credentials for the SFTP connection',
        type: 'string'
      },
      sftp_password: {
        label: 'SFTP Password credential',
        description: 'Acoustic credentials for the SFTP connection',
        type: 'password'
      },
      // Always a fixed path for Acoustic SFTP connections but future-proofing
      sftp_folder: {
        label: 'SFTP Folder Path',
        description: 'Acoustic Campaign SFTP folder path.',
        type: 'string',
        format: 'uri-reference'
      },
      version: {
        label: `Version:`,
        description: `\n${mod}\n`,
        default: 'Version 1.3',
        type: 'string',
        required: false
      },
      //Explore these intriguing options:
      __segment_internal_engage_force_full_sync: {
        label: 'Force Full Sync',
        description: 'Force full sync of an Audience versus receiving Audience updates as they occur.',
        type: 'boolean',
        required: true,
        default: true
      },
      __segment_internal_engage_batch_sync: {
        label: 'Batch sync via ADS',
        description: 'Force Batch mode Event updates versus singular Event updates as they occur.',
        type: 'boolean',
        required: true,
        default: true
      }
    },

    testAuthentication: async (_, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.

      // S3 authentication is skipped to avoid requiring a GetObject permission on the IAM role.
      if (settings.cacheType == 'SFTP') {
        const sftpClient = new ClientSFTP()
        InvalidAuthenticationError
        return await testAuthSFTP(sftpClient, settings)
      }

      if (settings.cacheType == 'S3') {
        const sftpClient = new ClientSFTP()
        InvalidAuthenticationError
        return await testAuthSFTP(sftpClient, settings)
      }
    }
  },
  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    request
    settings
    payload
  },
  presets,
  actions: {
    receiveEvents
  }
}
export default destination
