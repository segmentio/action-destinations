import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import receiveEvents from './receiveEvents/index'
import { testAuthenticationSFTP, Client as ClientSFTP } from './Utility/sendSFTP'
import { InvalidAuthenticationError } from '@segment/actions-core'

// import { getAccessToken } from './Utility/tablemaintutilities'
// import acousticS3TC from './receiveEvents/index_s3tc'

// import audienceEntered from './audienceEntered'

const mod = `
Last-Modified: 08.09.2023 16.22.49
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
      pod: {
        label: 'Pod',
        description: 'Pod Number for API Endpoint',
        default: '2',
        type: 'string',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Region for API Endpoint, either US, EU, AP, or CA',
        choices: [
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' },
          { label: 'AP', value: 'AP' },
          { label: 'CA', value: 'CA' }
        ],
        default: 'US',
        type: 'string',
        required: true
      },
      tableName: {
        label: 'Acoustic Segment Table Name',
        description: `The Segment Table Name in Acoustic Campaign Data dialog.`,
        default: 'Segment Events Table Name',
        type: 'string',
        required: true
      },
      tableListId: {
        label: 'Acoustic Segment Table List Id',
        description: 'The Segment Table List Id from the Database-Relational Table dialog in Acoustic Campaign',
        default: '',
        type: 'string',
        required: true
      },
      a_clientId: {
        label: 'Acoustic App Definition ClientId',
        description: 'The Client Id from the App definition dialog in Acoustic Campaign',
        default: '',
        type: 'string',
        required: true
      },
      a_clientSecret: {
        label: 'Acoustic App Definition ClientSecret',
        description: 'The Client Secret from the App definition dialog in Acoustic Campaign',
        default: '',
        type: 'password',
        required: true
      },
      a_refreshToken: {
        label: 'Acoustic App Access Definition RefreshToken',
        description: 'The RefreshToken provided when defining access for the App in Acoustic Campaign',
        default: '',
        type: 'password',
        required: true
      },
      attributesMax: {
        label: 'Properties Max',
        description:
          'A safety against mapping too many attributes into the Event, ignore Event if number of Event Attributes exceeds this maximum. Note: Before increasing the default max number, consult the Acoustic Destination documentation.',
        default: 15,
        type: 'number',
        required: false
      },
      version: {
        label: `Version:`,
        description: `${mod}`,
        default: 'Version 1.3',
        type: 'string',
        required: false
      },
      tcSend: {
        label: 'Transport',
        description: 'Choose transport option(default S3)',
        type: 'string',
        required: true,
        default: 'S3',
        choices: [
          { value: 'S3', label: 'S3' },
          { value: 'SFTP', label: 'SFTP' }
        ]
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
      s3_bucket_name: {
        label: 'S3 Bucket Name',
        description: 'Name of the S3 bucket where the files will be uploaded to.',
        default: 'tricklercache',
        type: 'string'
      },
      s3_region: {
        label: 'S3 Region',
        description: 'eg: us-east-1, us-east-2',
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
      storedFile: {
        label: 'Stored File Name',
        description: `Stored File Name`,
        type: 'string',
        required: false,
        default: 'customerid.json'
      },
      //Explore these intriguing options:
      __segment_internal_engage_force_full_sync: {
        label: 'Force Full Sync',
        description: '',
        type: 'boolean',
        required: true,
        default: true
      },
      __segment_internal_engage_batch_sync: {
        label: 'Batch sync via ADS',
        description: '',
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
      if (settings.tcSend == 'SFTP') {
        const sftpClient = new ClientSFTP()
        InvalidAuthenticationError
        return await testAuthenticationSFTP(sftpClient, settings)
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
