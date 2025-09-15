import { AudienceDestinationDefinition, defaultValues, IntegrationError } from '@segment/actions-core'
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
        'Name of the S3 Subfolder where the files will be uploaded to. e.g. segmentdata/ or segmentdata/audiences/',
      type: 'string',
      required: false
    },
    filename: {
      label: 'Filename prefix',
      description: `Prefix to append to the name of the uploaded file. A lower cased audience name and timestamp will be appended by default to the filename to ensure uniqueness.
                    Format: <PREFIX>_<AUDIENCE NAME>_<TIMESTAMP>.csv`,
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
      full_audience_sync: false
    },
    async createAudience(_, createAudienceInput) {
      const personas = createAudienceInput.personas as PersonasSettings
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
  },
  presets: [
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'syncAudienceToCSV',
      mapping: defaultValues(syncAudienceToCSV.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'syncAudienceToCSV',
      mapping: defaultValues(syncAudienceToCSV.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
