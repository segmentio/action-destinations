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
    throw new IntegrationError('Missing Customer Prefix', 'MISSING_CUSTOMER_PREFIX', 400)
  }
}

export { validateSettings }
