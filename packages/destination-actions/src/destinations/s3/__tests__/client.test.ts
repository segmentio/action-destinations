import { Client, isAWSError, mapAWSError } from '../syncToS3/client'
import { _Error as AWSError } from '@aws-sdk/client-s3'
import { APIError, ErrorCodes, IntegrationError, RetryableError } from '@segment/actions-core'
import type { Features } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { S3_STS_ERROR_CLASSIFICATION_FLAG } from '../constants'

// Controllable STS send mock so tests can simulate assume-role failures.
const mockStsSend = jest.fn()
// Controllable S3 send mock so tests can simulate PUT failures.
const mockS3Send = jest.fn()

// Mock AWS SDK before any imports to avoid initialization issues
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send
  })),
  PutObjectCommand: jest.fn(),
  _Error: jest.fn()
}))

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({
    send: mockStsSend
  })),
  AssumeRoleCommand: jest.fn()
}))

describe('isAWSError', () => {
  it('should return true for a valid AWS error', () => {
    const error: AWSError = {
      Code: 'AccessDenied',
      Message: 'Access Denied'
    }
    expect(isAWSError(error)).toBe(true)
  })

  it('should return false for a non-AWS error', () => {
    const error = new Error('Some other error')
    expect(isAWSError(error)).toBe(false)
  })

  it('should return false for an object without Code and Message properties', () => {
    const error = { name: 'SomeError', message: 'Some error message' }
    expect(isAWSError(error)).toBe(false)
  })

  it('should return false for null', () => {
    expect(isAWSError(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isAWSError(undefined)).toBe(false)
  })

  it('should return false for a string', () => {
    expect(isAWSError('Some error')).toBe(false)
  })

  it('should return false for a number', () => {
    expect(isAWSError(123)).toBe(false)
  })

  it('should return false for an object without Code property', () => {
    const error = { Message: 'Some error message' }
    expect(isAWSError(error)).toBe(false)
  })

  it('should return false for an object without Message property', () => {
    const error = { Code: 'SomeError' }
    expect(isAWSError(error)).toBe(false)
  })
})

describe('Client STS assume-role error handling', () => {
  const settings: Settings = {
    iam_role_arn: 'arn:aws:iam::123456789012:role/test',
    s3_aws_bucket_name: 'test-bucket',
    s3_aws_region: 'us-east-1',
    iam_external_id: 'external-id'
  }

  const flagOn: Features = { [S3_STS_ERROR_CLASSIFICATION_FLAG]: true }
  const newClient = (features?: Features) =>
    new Client('us-east-1', settings.iam_role_arn, settings.iam_external_id, features)
  const upload = (client: Client) => client.uploadS3(settings, 'content', 'file', '', 'csv')

  beforeEach(() => {
    mockStsSend.mockReset()
  })

  it('is off by default: an STS failure is NOT wrapped and escapes unclassified (prior behavior)', async () => {
    const rawError = new Error('Could not load credentials from any providers')
    mockStsSend.mockRejectedValue(rawError)

    const err = await upload(newClient()).catch((e: unknown) => e)

    // The raw rejection propagates as-is — not mapped to any Segment error class.
    expect(err).toBe(rawError)
    expect(err).not.toBeInstanceOf(RetryableError)
    expect(err).not.toBeInstanceOf(APIError)
  })

  // Regression: STS failures used to escape uploadS3's try/catch (assumeRole ran before it), so
  // they reached the platform unwrapped (no status/code), got classified type:internal and were
  // force-retried. When enabled, they must be mapped to a Segment error class with a status.
  it('when enabled, wraps a "could not load credentials" STS failure in a classified RetryableError', async () => {
    mockStsSend.mockRejectedValue(new Error('Could not load credentials from any providers'))

    const err = await upload(newClient(flagOn)).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(RetryableError)
    expect((err as Error).message).toContain('Could not load credentials from any providers')
    expect((err as RetryableError).status).toBeDefined()
  })

  // Regression: permanent authorization failures from STS must NOT be force-retried when enabled —
  // but only for the CUSTOMER role assumption. The intermediary (Segment-internal) hop resolves
  // successfully here so this test isolates the customer-hop classification.
  it('when enabled, maps a permanent STS access-denied failure on the CUSTOMER role to a non-retryable 403 error', async () => {
    const stsError = Object.assign(new Error('User is not authorized to perform sts:AssumeRole'), {
      name: 'AccessDenied',
      $fault: 'client',
      $metadata: { httpStatusCode: 403 }
    })
    mockStsSend
      .mockResolvedValueOnce({
        Credentials: { AccessKeyId: 'AKIA_INTERMEDIARY', SecretAccessKey: 'secret', SessionToken: 'token' }
      })
      .mockRejectedValueOnce(stsError)

    const err = await upload(newClient(flagOn)).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(APIError)
    expect(err).not.toBeInstanceOf(RetryableError)
    expect((err as APIError).status).toBe(403)
  })

  // Regression: a transient/permission hiccup on Segment's OWN intermediary role must always be
  // retryable — it's not a customer misconfiguration, so it must not get the strict customer-facing
  // classification (which could otherwise permanently reject it).
  it('when enabled, always treats an intermediary-role STS failure as retryable, even with an access-denied shape', async () => {
    const stsError = Object.assign(new Error('User is not authorized to perform sts:AssumeRole'), {
      name: 'AccessDenied',
      $fault: 'client',
      $metadata: { httpStatusCode: 403 }
    })
    mockStsSend.mockRejectedValueOnce(stsError)

    const err = await upload(newClient(flagOn)).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(RetryableError)
    expect(err).not.toBeInstanceOf(APIError)
  })
})

describe('uploadS3 PUT error classification (flag-off legacy path parity)', () => {
  const settings: Settings = {
    iam_role_arn: 'arn:aws:iam::123456789012:role/test',
    s3_aws_bucket_name: 'test-bucket',
    s3_aws_region: 'us-east-1',
    iam_external_id: 'external-id'
  }
  const newClient = (features?: Features) =>
    new Client('us-east-1', settings.iam_role_arn, settings.iam_external_id, features)
  const upload = (client: Client) => client.uploadS3(settings, 'content', 'file', '', 'csv')

  beforeEach(() => {
    mockStsSend.mockReset()
    mockS3Send.mockReset()
    mockStsSend.mockResolvedValue({
      Credentials: { AccessKeyId: 'AKIA_TEST', SecretAccessKey: 'secret', SessionToken: 'token' }
    })
  })

  // Regression: mapAWSError's accessDeniedCodes set (flag-on) adds ExpiredToken/ExpiredTokenException/
  // AccessDeniedException on top of the original codes, but the flag-off legacy path must keep using
  // ONLY the original set — otherwise flag-off would silently start classifying these as 403 where main
  // never did, breaking the "flag off == main behavior" guarantee this whole re-ship depends on.
  it.each(['ExpiredToken', 'ExpiredTokenException', 'AccessDeniedException'])(
    'is off by default: does NOT classify %s as a non-retryable 403 via the legacy path',
    async (code) => {
      mockS3Send.mockRejectedValue({ Code: code, Message: 'nope' })

      const err = await upload(newClient()).catch((e: unknown) => e)

      expect(err).not.toBeInstanceOf(APIError)
      expect(err).toBeInstanceOf(RetryableError)
    }
  )
})

describe('mapAWSError', () => {
  it('classifies access-denied AWS errors as non-retryable 403', () => {
    const err = mapAWSError({ Code: 'AccessDenied', Message: 'nope' }, 'AWS PUT failed')
    expect(err).toBeInstanceOf(APIError)
    expect((err as APIError).status).toBe(403)
  })

  it('classifies throttling as 429', () => {
    const err = mapAWSError({ name: 'ThrottlingException', message: 'slow down' }, 'Failed to assume AWS role')
    expect(err).toBeInstanceOf(APIError)
    expect((err as APIError).status).toBe(429)
  })

  it('classifies a client fault (4xx) as a non-retryable IntegrationError', () => {
    const err = mapAWSError(
      { name: 'ValidationError', message: 'bad', $fault: 'client', $metadata: { httpStatusCode: 400 } },
      'Failed to assume AWS role'
    )
    expect(err).toBeInstanceOf(IntegrationError)
    expect(err).not.toBeInstanceOf(RetryableError)
    expect((err as IntegrationError).status).toBe(400)
  })

  it('classifies a wrong-region PermanentRedirect (301) as a non-retryable 401, not the raw 3xx, and does not mislabel it as an auth error', () => {
    const err = mapAWSError(
      {
        Code: 'PermanentRedirect',
        Message: 'The bucket you are attempting to access must be addressed using the specified endpoint.',
        $fault: 'client',
        $metadata: { httpStatusCode: 301 }
      },
      'AWS PUT failed'
    )
    expect(err).toBeInstanceOf(IntegrationError)
    expect(err).not.toBeInstanceOf(RetryableError)
    expect((err as IntegrationError).status).toBe(401)
    // Regression: a region mismatch is a config problem, not a credentials problem — must not be
    // stamped with INVALID_AUTHENTICATION, which would misdirect customers/on-call toward rotating
    // credentials instead of fixing s3_aws_region.
    expect((err as IntegrationError).code).not.toBe(ErrorCodes.INVALID_AUTHENTICATION)
  })

  it('includes the AWS request id in the error detail when present, for incident correlation', () => {
    const err = mapAWSError(
      { Code: 'AccessDenied', Message: 'nope', $metadata: { requestId: 'req-123' } },
      'AWS PUT failed'
    )
    expect(err.message).toContain('req-123')
  })

  it('never surfaces a non-4xx status from the generic client-fault branch (clamps to 400)', () => {
    // A client-fault error carrying a 3xx status must not leak that 3xx as the error status.
    const err = mapAWSError({ name: 'SomeRedirect', message: 'moved', $fault: 'client', $metadata: { httpStatusCode: 302 } }, 'AWS PUT failed')
    expect(err).toBeInstanceOf(IntegrationError)
    expect((err as IntegrationError).status).toBe(400)
  })

  it('treats unclassified / server-side failures as retryable', () => {
    const err = mapAWSError(new Error('Could not load credentials from any providers'), 'Failed to assume AWS role')
    expect(err).toBeInstanceOf(RetryableError)
    expect(err.message).toContain('Could not load credentials from any providers')
  })

  it('classifies NoSuchBucket as a non-retryable 404', () => {
    const err = mapAWSError({ Code: 'NoSuchBucket', Message: 'no such bucket' }, 'AWS PUT failed')
    expect(err).toBeInstanceOf(APIError)
    expect(err).not.toBeInstanceOf(RetryableError)
    expect((err as APIError).status).toBe(404)
  })

  // Regression: these carry a 4xx status but AWS documents them as transient/safe to retry, so
  // they must not fall into the generic "4xx is permanent" branch.
  it('treats OperationAborted (409) as retryable despite its 4xx status', () => {
    const err = mapAWSError(
      { Code: 'OperationAborted', Message: 'conflicting operation in progress', $fault: 'client', $metadata: { httpStatusCode: 409 } },
      'AWS PUT failed'
    )
    expect(err).toBeInstanceOf(RetryableError)
  })

  it('treats RequestTimeout (400) as retryable despite its 4xx status', () => {
    const err = mapAWSError(
      { Code: 'RequestTimeout', Message: 'upload stalled', $fault: 'client', $metadata: { httpStatusCode: 400 } },
      'AWS PUT failed'
    )
    expect(err).toBeInstanceOf(RetryableError)
  })

  it('does not mislabel an unclassified 4xx client fault as an authentication error', () => {
    const err = mapAWSError(
      { name: 'ValidationError', message: 'bad', $fault: 'client', $metadata: { httpStatusCode: 400 } },
      'Failed to assume AWS role'
    )
    expect(err).toBeInstanceOf(IntegrationError)
    expect((err as IntegrationError).code).not.toBe(ErrorCodes.INVALID_AUTHENTICATION)
  })

  it('treats a $fault: server error with a 5xx status as retryable, not a client fault', () => {
    const err = mapAWSError(
      { name: 'InternalError', message: 'internal', $fault: 'server', $metadata: { httpStatusCode: 500 } },
      'AWS PUT failed'
    )
    expect(err).toBeInstanceOf(RetryableError)
  })

  it('clamps to 400 when $fault is client and $metadata is entirely absent', () => {
    const err = mapAWSError({ name: 'SomeClientFault', message: 'bad', $fault: 'client' }, 'AWS PUT failed')
    expect(err).toBeInstanceOf(IntegrationError)
    expect((err as IntegrationError).status).toBe(400)
  })
})
