/* eslint-disable @typescript-eslint/no-unused-vars */
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
        choices: [
          { value: 'S3', label: 'S3' },
          { value: 'SFTP', label: 'SFTP' }
        ]
      },
      s3_aws_access_key: {
        label: 'AWS Access Key (S3 only)',
        description: '',
        type: 'string'
      },
      s3_aws_secret_key: {
        label: 'AWS Secret Key (S3 only)',
        description: '',
        type: 'password'
      },
      s3_aws_bucket_name: {
        label: 'AWS Bucket Name (S3 only)',
        description: '',
        type: 'string'
      },
      sftp_username: {
        label: 'Username (SFTP only)',
        description: '',
        type: 'string'
      },
      sftp_password: {
        label: 'Password (SFTP only)',
        description: '',
        type: 'password'
      }
    },
    testAuthentication: (_) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  onDelete: async (_) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    audienceEntered
  }
}

export default destination
