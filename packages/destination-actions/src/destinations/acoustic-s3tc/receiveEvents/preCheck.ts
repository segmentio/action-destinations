import { IntegrationError } from '@segment/actions-core'
import { Settings } from '../generated-types'

function validateSettings(settings: Settings) {
  if (!settings.s3_access_key) {
    throw new IntegrationError('Missing S3 Access Key', 'MISSING_S3_ACCESS_KEY', 400)
  }

  if (!settings.s3_secret) {
    throw new IntegrationError('Missing S3 Secret.', 'MISSING_S3_SECRET', 400)
  }

  if (!settings.s3_region) {
    throw new IntegrationError('Missing S3 Region', 'MISSING_S3_REGION', 400)
  }

  if (!settings.s3_bucket_accesspoint_alias) {
    throw new IntegrationError('Missing S3 Bucket Access Point.', 'MISSING_S3_BUCKET_ACCESS_POINT', 400)
  }

  if (!settings.fileNamePrefix) {
    throw new IntegrationError(
      'Missing Customer Prefix. Customer Prefix should be of the form of 4-5 characters followed by an underscore character',
      'MISSING_CUSTOMER_PREFIX',
      400
    )
  }
  if (!settings.fileNamePrefix.endsWith('_')) {
    throw new IntegrationError(
      'Invalid Customer Prefix. Customer Prefix must end with an underscore character "_".  ',
      'INVALID_CUSTOMER_PREFIX',
      400
    )
  }
  if (settings.fileNamePrefix === 'customer_org_') {
    throw new IntegrationError(
      'Unedited Customer Prefix. Customer Prefix remains as the default value, must edit and provide a valid Customer prefix (4-5 characters) followed by an underscore',
      'INVALID_CUSTOMER_PREFIX',
      400
    )
  }
}

export { validateSettings }
