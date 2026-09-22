import { PayloadValidationError } from '@segment/actions-core'
import type { Features } from '@segment/actions-core'
import { Settings } from '../../generated-types'
import { S3_KEY_LENGTH_GUARD_FLAG } from '../../constants'

// Shared spies so each test can assert whether AWS was actually contacted.
const mockStsSend = jest.fn()
const mockS3Send = jest.fn()

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({ send: mockStsSend })),
  AssumeRoleCommand: jest.fn()
}))

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  PutObjectCommand: jest.fn(),
  _Error: jest.fn()
}))

// Import after the mocks are registered.
import { Client } from '../client'

const settings: Settings = {
  iam_role_arn: 'arn:aws:iam::123456789012:role/test',
  s3_aws_bucket_name: 'test-bucket',
  s3_aws_region: 'us-east-1',
  iam_external_id: 'external-id'
}

// assumeRole() calls STS twice (intermediary role, then the customer role); both must
// return a full set of credentials for the happy path to reach the PUT.
const validStsResponse = {
  Credentials: {
    AccessKeyId: 'AKIA_TEST',
    SecretAccessKey: 'secret',
    SessionToken: 'token'
  }
}

function newClient() {
  return new Client('us-east-1', settings.iam_role_arn, settings.iam_external_id)
}

const flagOn: Features = { [S3_KEY_LENGTH_GUARD_FLAG]: true }

describe('uploadS3 object key length guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStsSend.mockResolvedValue(validStsResponse)
    mockS3Send.mockResolvedValue({})
  })

  // A multi-byte folder name: 400 "€" chars = 1200 bytes but only 400 characters. This is
  // well under 1024 *characters*, so a naive `.length` check would let it through — proving the
  // guard measures UTF-8 bytes, not characters. With the "/" separator plus the generated
  // filename it comfortably exceeds the 1024-byte limit.
  const overLongFolder = () => '€'.repeat(400)

  it('is off by default: an over-long object key is NOT rejected and proceeds to PUT', async () => {
    const client = newClient()

    const result = await client.uploadS3(settings, 'file,content', '', overLongFolder(), 'csv')

    expect(result).toEqual({ statusCode: 200, message: 'Upload successful' })
    expect(mockS3Send).toHaveBeenCalledTimes(1)
  })

  it('when enabled, rejects an object key over 1024 bytes with a non-retryable PayloadValidationError and does not PUT', async () => {
    const client = newClient()

    const promise = client.uploadS3(settings, 'file,content', '', overLongFolder(), 'csv', flagOn)

    await expect(promise).rejects.toThrow(PayloadValidationError)
    await expect(promise).rejects.toThrow('1024 bytes')
    // Fails fast: no role assumption and no PUT are attempted.
    expect(mockStsSend).not.toHaveBeenCalled()
    expect(mockS3Send).not.toHaveBeenCalled()
  })

  it('when enabled, does not leak the (potentially PII-laden) key content in the error message', async () => {
    const client = newClient()
    const secretFolder = 'super-secret-pii-'.repeat(80) // > 1024 bytes

    const error = await client
      .uploadS3(settings, 'file,content', '', secretFolder, 'csv', flagOn)
      .catch((e) => e as Error)

    expect(error).toBeInstanceOf(PayloadValidationError)
    expect(error.message).not.toContain('super-secret-pii')
  })

  it('when enabled, proceeds to PUT for an object key at/below 1024 bytes', async () => {
    const client = newClient()

    const result = await client.uploadS3(settings, 'file,content', 'export', 'my-folder', 'csv', flagOn)

    expect(result).toEqual({ statusCode: 200, message: 'Upload successful' })
    expect(mockS3Send).toHaveBeenCalledTimes(1)
  })
})
