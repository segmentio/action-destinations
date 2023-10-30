import { IntegrationError } from '@segment/actions-core'
import { validateSettings } from '../preCheck'

jest.mock('@segment/actions-core')
jest.mock('../../generated-types')

const validS3Settings = {
  s3_access_key: 'access_key',
  s3_secret: 'secret',
  s3_region: 'us-east-1',
  s3_bucket_accesspoint_alias: 'my-bucket',
  fileNamePrefix: 'prefix'
}

describe('validateSettings', () => {
  test('valid S3 settings', () => {
    expect(() => validateSettings(validS3Settings)).not.toThrow()
  })

  test('missing accessKey', () => {
    const settings = {
      s3_access_key: '',
      s3_secret: 'secret',
      s3_region: 'us-east-1',
      s3_bucket_accesspoint_alias: 'my-bucket',
      fileNamePrefix: 'prefix'
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })

  test('missing secret', () => {
    const settings = {
      s3_access_key: 'access_key',
      s3_secret: '',
      s3_region: 'us-east-1',
      s3_bucket_accesspoint_alias: 'my-bucket',
      fileNamePrefix: 'prefix'
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })

  test('missing region', () => {
    const settings = {
      s3_access_key: 'access_key',
      s3_secret: 'secret',
      s3_region: '',
      s3_bucket_accesspoint_alias: 'my-bucket',
      fileNamePrefix: 'prefix'
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })

  test('missing fileNamePrefix', () => {
    const settings = {
      s3_access_key: 'access_key',
      s3_secret: 'secret',
      s3_region: 'us-east-1',
      s3_bucket_accesspoint_alias: 'my-bucket',
      fileNamePrefix: ''
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })

  test('missing S3 settings', () => {
    const settings = {
      s3_access_key: '',
      s3_secret: '',
      s3_region: '',
      s3_bucket_accesspoint_alias: '',
      fileNamePrefix: ''
    }

    expect(() => validateSettings(settings)).toThrow(IntegrationError)
  })
})
