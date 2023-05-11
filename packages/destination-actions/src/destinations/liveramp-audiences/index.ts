import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import audienceEntered from './audienceEntered'

const destination: DestinationDefinition<Settings> = {
  name: 'Liveramp Audiences',
  slug: 'actions-liveramp-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      upload_mode: {
        label: 'Upload Mode',
        description: 'Choose delivery route for the files',
        type: 'string',
        required: true,
        default: 'S3',
        choices: [
          { value: 'S3', label: 'S3' },
          { value: 'SFTP', label: 'SFTP' }
        ]
      },
      s3_aws_access_key: {
        label: 'AWS Access Key ID (S3 only)',
        description: 'IAM user credentials with write permissions to the S3 bucket.',
        type: 'string'
      },
      s3_aws_secret_key: {
        label: 'AWS Secret Access Key (S3 only)',
        description: 'IAM user credentials with write permissions to the S3 bucket.',
        type: 'password'
      },
      s3_aws_bucket_name: {
        label: 'AWS Bucket Name (S3 only)',
        description: 'Name of the S3 bucket where the files will be uploaded to.',
        type: 'string'
      },
      s3_aws_region: {
        label: 'AWS Region (S3 only)',
        description: 'Region where the S3 bucket is hosted.',
        type: 'string'
      },
        type: 'string'
      },
      sftp_username: {
        label: 'Username (SFTP only)',
        description: 'User credentials for establishing an SFTP connection with LiveRamp.',
        type: 'string'
      },
      sftp_password: {
        label: 'Password (SFTP only)',
        description: 'User credentials for establishing an SFTP connection with LiveRamp.',
        type: 'password'
      },
      sftp_folder_path: {
        label: 'Folder Path (SFTP only)',
        description: 'Path within the SFTP server to upload the files to.',
        type: 'string'
      }
    },
    testAuthentication: (_) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      // TODO: Validate SFTP
    }
  },
  actions: {
    audienceEntered
  }
}

export default destination
