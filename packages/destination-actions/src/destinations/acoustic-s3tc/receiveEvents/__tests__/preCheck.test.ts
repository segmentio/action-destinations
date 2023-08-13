import { IntegrationError } from '@segment/actions-core'
import { validateSettings } from '../preCheck'

jest.mock('@segment/actions-core')
jest.mock('../../generated-types')

const validS3Settings = {
  cacheType: 'S3',
  s3_access_key: 'access_key',
  s3_secret: 'secret',
  s3_region: 'us-west-1',
  s3_bucket: 'my-bucket',
  fileNamePrefix: 'prefix',
  __segment_internal_engage_force_full_sync: false,
  __segment_internal_engage_batch_sync: false
}

const validSFTPSettings = {
  cacheType: 'SFTP',
  sftp_user: 'username',
  sftp_password: 'password',
  sftp_folder: '/path/to/folder',
  fileNamePrefix: 'prefix',
  __segment_internal_engage_force_full_sync: false,
  __segment_internal_engage_batch_sync: false
}

describe('validateSettings', () => {
  test('valid S3 settings', () => {
    expect(() => validateSettings(validS3Settings)).not.toThrow()
  })

  test('valid SFTP settings', () => {
    expect(() => validateSettings(validSFTPSettings)).not.toThrow()
  })

  test('missing cacheType', () => {
    const settings = {
      s3_access_key: 'access_key',
      s3_secret: 'secret',
      s3_region: 'us-east-1',
      s3_bucket: 'my-bucket',
      fileNamePrefix: 'prefix',
      __segment_internal_engage_force_full_sync: false,
      __segment_internal_engage_batch_sync: false
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })

  test('missing S3 settings', () => {
    const settings = {
      cacheType: 'S3',
      fileNamePrefix: 'prefix'
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })

  test('missing SFTP settings', () => {
    const settings = {
      cacheType: 'SFTP',
      fileNamePrefix: 'prefix'
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })

  test('missing fileNamePrefix', () => {
    const settings = {
      cacheType: 'S3',
      s3_access_key: 'access_key',
      s3_secret: 'secret',
      s3_region: 'us-east-1',
      s3_bucket: 'my-bucket'
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })
})
