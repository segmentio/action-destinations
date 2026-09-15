import { PayloadValidationError } from '@segment/actions-core'
import { Settings } from '../../generated-types'

// Shared spies so each test can assert whether AWS was actually contacted.
const stsSend = jest.fn()
const s3Send = jest.fn()

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({ send: stsSend })),
  AssumeRoleCommand: jest.fn()
}))

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: s3Send })),
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

describe('uploadS3 object key length guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    stsSend.mockResolvedValue(validStsResponse)
    s3Send.mockResolvedValue({})
  })

  it('rejects an object key over 1024 bytes with a non-retryable PayloadValidationError and does not PUT', async () => {
    const client = newClient()
    // A multi-byte folder name: 400 "€" chars = 1200 bytes but only 400 characters. This is
    // well under 1024 *characters*, so a naive `.length` check would let it through — proving the
    // guard measures UTF-8 bytes, not characters. With the "/" separator plus the generated
    // filename it comfortably exceeds the 1024-byte limit.
    const overLongFolder = '€'.repeat(400)

    const promise = client.uploadS3(settings, 'file,content', '', overLongFolder, 'csv')

    await expect(promise).rejects.toThrow(PayloadValidationError)
    await expect(promise).rejects.toThrow('1024 bytes')
    // Fails fast: no role assumption and no PUT are attempted.
    expect(stsSend).not.toHaveBeenCalled()
    expect(s3Send).not.toHaveBeenCalled()
  })

  it('does not leak the (potentially PII-laden) key content in the error message', async () => {
    const client = newClient()
    const secretFolder = 'super-secret-pii-'.repeat(80) // > 1024 bytes

    const error = await client.uploadS3(settings, 'file,content', '', secretFolder, 'csv').catch((e) => e as Error)

    expect(error).toBeInstanceOf(PayloadValidationError)
    expect(error.message).not.toContain('super-secret-pii')
  })

  it('proceeds to PUT for an object key at/below 1024 bytes', async () => {
    const client = newClient()

    const result = await client.uploadS3(settings, 'file,content', 'export', 'my-folder', 'csv')

    expect(result).toEqual({ statusCode: 200, message: 'Upload successful' })
    expect(s3Send).toHaveBeenCalledTimes(1)
  })
})
