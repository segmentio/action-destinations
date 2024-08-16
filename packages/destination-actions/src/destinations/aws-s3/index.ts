import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'

import syncAudienceToCSV from './syncAudienceToCSV'

type PersonasSettings = {
  computation_id: string
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'AWS S3 CSV',
  slug: 'actions-s3-csv',
  mode: 'cloud',
  description: 'Sync Segment event and Audience data to AWS S3.',
  audienceFields: {
    s3_aws_folder_name: {
      label: 'AWS Subfolder Name',
      description:
        'Name of the S3 Subfolder where the files will be uploaded to. "/" must exist at the end of the folder name.',
      type: 'string',
      required: false
    },
    filename: {
      label: 'Filename prefix',
      description: `Prefix to append to the name of the uploaded file. A timestamp and lower cased audience name will be appended to the filename to ensure uniqueness.`,
      type: 'string',
      required: false
    },
    delimiter: {
      label: 'Delimeter',
      description: `Character used to separate tokens in the resulting file.`,
      type: 'string',
      required: true,
      choices: [
        { label: 'comma', value: ',' },
        { label: 'pipe', value: '|' },
        { label: 'tab', value: 'tab' },
        { label: 'semicolon', value: ';' },
        { label: 'colon', value: ':' }
      ],
      default: ','
    }
  },
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
        label: 'AWS Region Code (S3 only)',
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
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: true
    },
    async createAudience(_, createAudienceInput) {
      const audienceSettings = createAudienceInput.audienceSettings
      // @ts-ignore type is not defined, and we will define it later
      const personas = audienceSettings.personas as PersonasSettings
      if (!personas) {
        throw new IntegrationError('Missing computation parameters: Id and Key', 'MISSING_REQUIRED_FIELD', 400)
      }

      return { externalId: personas.computation_id }
    },
    async getAudience(_, getAudienceInput) {
      const audience_id = getAudienceInput.externalId
      if (!audience_id) {
        throw new IntegrationError('Missing audience_id value', 'MISSING_REQUIRED_FIELD', 400)
      }
      return { externalId: audience_id }
    }
  },
  actions: {
    syncAudienceToCSV
  }
}

export default destination
