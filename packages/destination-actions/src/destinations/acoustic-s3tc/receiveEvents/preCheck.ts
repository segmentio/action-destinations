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

  if (!settings.s3_bucket) {
    throw new IntegrationError('Missing S3 Bucket.', 'MISSING_S3_BUCKET', 400)
  }

  if (!settings.fileNamePrefix) {
    throw new IntegrationError('Missing File Name Prefix', 'MISSING_FILE_NAME_PREFIX', 400)
  }
}

export { validateSettings }
