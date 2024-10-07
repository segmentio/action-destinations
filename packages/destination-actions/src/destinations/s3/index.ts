import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'
import syncToS3 from './syncToS3'

const destination: DestinationDefinition<Settings> = {
  name: 'AWS S3 (Actions)',
  slug: 'actions-s3',
  mode: 'cloud',
  description: 'Sync Segment event data to AWS S3.',

  authentication: {
    scheme: 'custom',
    fields: {
      iam_role_arn: {
        label: 'IAM Role ARN',
        description:
          'IAM role ARN with write permissions to the S3 bucket. Format: arn:aws:iam::account-id:role/role-name',
        type: 'string',
        required: true
      },
      s3_aws_bucket_name: {
        label: 'AWS Bucket Name',
        description: 'Name of the S3 bucket where the files will be uploaded to.',
        type: 'string',
        required: true
      },
      s3_aws_region: {
        label: 'AWS Region Code',
        description:
          'Region Code where the S3 bucket is hosted. See [AWS S3 Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-regions)',
        type: 'string',
        required: true
      },
      iam_external_id: {
        label: 'IAM External ID',
        description: 'The External ID to your IAM role. Generate a secure string and treat it like a password.',
        type: 'password',
        required: true
      }
    }
  },
  extendRequest() {
    return {
      timeout: Math.max(60_000, DEFAULT_REQUEST_TIMEOUT)
    }
  },
  actions: {
    syncToS3
  }
}

export default destination
