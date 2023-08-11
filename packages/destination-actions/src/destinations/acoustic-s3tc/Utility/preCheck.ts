import { IntegrationError } from '@segment/actions-core'
import { Settings } from '../generated-types'

function validateSettings(settings: Settings) {
  if (!settings.cacheType) throw new IntegrationError('Invalid Transport Option', 'INVLAID_TRANSPORT_OPTION', 400)

  if (settings.cacheType === 'S3') {
    if (!settings.s3_access_key) {
      throw new IntegrationError('Missing S3 Access Key', 'MISSING_S3_ACCESS_KEY', 400)
    }

    if (!settings.s3_secret) {
      throw new IntegrationError('Missing S3 Secret.', 'MISSING_S3_SECRET', 400)
    }

    if (!settings.s3_region) throw new IntegrationError('Missing S3 Region', 'MISSING_S3_REGION', 400)

    if (!settings.s3_bucket) throw new IntegrationError('Missing S3 Bucket.', 'MISSING_S3_BUCKET', 400)
  }
  if (settings.cacheType === 'SFTP') {
    if (!settings.sftp_user) throw new IntegrationError('Missing SFTP User.', 'MISSING_SFTP_USER', 400)

    if (!settings.sftp_password) throw new IntegrationError('Missing SFTP Password.', 'MISSING_SFTP_PASSWORD', 400)

    if (!settings.sftp_folder) throw new IntegrationError('Missing SFTP Folder.', 'MISSING_SFTP_FOLDER', 400)
  }

  if (!settings.fileNamePrefix) throw new IntegrationError('Missing File Name Prefix', 'MISSING_FILE_NAME_PREFIX', 400)
}

export { validateSettings }
