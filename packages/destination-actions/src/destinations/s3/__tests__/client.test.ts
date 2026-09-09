import { Client, clearCredentialsCache, isAWSError, mapAWSError } from '../syncToS3/client'
import { _Error as AWSError } from '@aws-sdk/client-s3'
import { APIError, IntegrationError, RetryableError } from '@segment/actions-core'
import type { StatsContext } from '@segment/actions-core'
import { Settings } from '../generated-types'

// Controllable STS send mock so tests can simulate assume-role failures.
const mockStsSend = jest.fn()

// Mock AWS SDK before any imports to avoid initialization issues
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn()
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

  const newClient = () => new Client('us-east-1', settings.iam_role_arn, settings.iam_external_id)
  const upload = (client: Client) => client.uploadS3(settings, 'content', 'file', '', 'csv')

  beforeEach(() => {
    mockStsSend.mockReset()
  })

  // Regression: STS failures used to escape uploadS3's try/catch (assumeRole ran before it), so
  // they reached the platform unwrapped (no status/code), got classified type:internal and were
  // force-retried. They must now be mapped to a Segment error class with a status.
  it('wraps a "could not load credentials" STS failure in a classified RetryableError', async () => {
    mockStsSend.mockRejectedValue(new Error('Could not load credentials from any providers'))

    const err = await upload(newClient()).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(RetryableError)
    expect((err as Error).message).toContain('Could not load credentials from any providers')
    expect((err as RetryableError).status).toBeDefined()
  })

  // Regression: permanent authorization failures from STS must NOT be force-retried.
  it('maps a permanent STS access-denied failure to a non-retryable 403 error', async () => {
    const stsError = Object.assign(new Error('User is not authorized to perform sts:AssumeRole'), {
      name: 'AccessDenied',
      $fault: 'client',
      $metadata: { httpStatusCode: 403 }
    })
    mockStsSend.mockRejectedValue(stsError)

    const err = await upload(newClient()).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(APIError)
    expect(err).not.toBeInstanceOf(RetryableError)
    expect((err as APIError).status).toBe(403)
  })
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

  it('treats unclassified / server-side failures as retryable', () => {
    const err = mapAWSError(new Error('Could not load credentials from any providers'), 'Failed to assume AWS role')
    expect(err).toBeInstanceOf(RetryableError)
    expect(err.message).toContain('Could not load credentials from any providers')
  })
})

describe('STS credential caching', () => {
  const settings: Settings = {
    iam_role_arn: 'arn:aws:iam::123456789012:role/test',
    s3_aws_bucket_name: 'test-bucket',
    s3_aws_region: 'us-east-1',
    iam_external_id: 'external-id'
  }

  // A minimal successful AssumeRole response whose credentials expire `expiresInMs` from now.
  const stsResponse = (expiresInMs: number) => ({
    Credentials: {
      AccessKeyId: 'AKIAEXAMPLE',
      SecretAccessKey: 'secret',
      SessionToken: 'token',
      Expiration: new Date(Date.now() + expiresInMs)
    }
  })

  const newClient = (roleArn = settings.iam_role_arn) =>
    new Client(settings.s3_aws_region, roleArn, settings.iam_external_id)
  const upload = (client: Client) => client.uploadS3(settings, 'content', 'file', '', 'csv')

  beforeEach(() => {
    mockStsSend.mockReset()
    clearCredentialsCache()
  })

  it('reuses cached credentials across uploads instead of re-calling STS for every file', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await upload(newClient())
    await upload(newClient())

    // First upload assumes both roles (intermediary + customer) = 2 STS calls.
    // Second upload finds both cached = 0 STS calls.
    expect(mockStsSend).toHaveBeenCalledTimes(2)
  })

  it('refreshes credentials once they fall within the expiry safety buffer', async () => {
    // Expires in 1 minute, inside the 5-minute refresh buffer -> never safe to cache.
    mockStsSend.mockResolvedValue(stsResponse(60 * 1000))

    await upload(newClient())
    await upload(newClient())

    expect(mockStsSend).toHaveBeenCalledTimes(4)
  })

  it('caches per role identity while sharing the intermediary role', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await upload(newClient('arn:aws:iam::123456789012:role/test'))
    await upload(newClient('arn:aws:iam::999999999999:role/other'))

    // Intermediary role assumed once (shared), plus one customer assume-role per distinct ARN = 3.
    expect(mockStsSend).toHaveBeenCalledTimes(3)
  })

  it('does not cache when STS omits an expiration', async () => {
    mockStsSend.mockResolvedValue({
      Credentials: { AccessKeyId: 'AKIA', SecretAccessKey: 'secret', SessionToken: 'token' }
    })

    await upload(newClient())
    await upload(newClient())

    expect(mockStsSend).toHaveBeenCalledTimes(4)
  })

  describe('DataDog metrics', () => {
    const stsOk = () => ({
      Credentials: {
        AccessKeyId: 'AKIAEXAMPLE',
        SecretAccessKey: 'secret',
        SessionToken: 'token',
        Expiration: new Date(Date.now() + 60 * 60 * 1000)
      }
    })

    const makeStatsContext = () => {
      const incr = jest.fn()
      const statsContext = { statsClient: { incr }, tags: ['dest:s3'] } as unknown as StatsContext
      return { statsContext, incr }
    }
    const clientWithStats = (statsContext: StatsContext) =>
      new Client(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id, statsContext)

    it('emits miss + set on first assume-role, hit on the second, tagged per role_type', async () => {
      mockStsSend.mockResolvedValue(stsOk())
      const { statsContext, incr } = makeStatsContext()

      // First upload: both hops miss then set. Second upload: both hops hit.
      await upload(clientWithStats(statsContext))
      await upload(clientWithStats(statsContext))

      const names = incr.mock.calls.map((c: unknown[]) => c[0])
      expect(names.filter((n: string) => n === 'sts_credential_cache_miss')).toHaveLength(2)
      expect(names.filter((n: string) => n === 'sts_credential_cache_set')).toHaveLength(2)
      expect(names.filter((n: string) => n === 'sts_credential_cache_hit')).toHaveLength(2)

      // Metrics carry the caller's tags plus the role_type of each hop.
      expect(incr).toHaveBeenCalledWith('sts_credential_cache_miss', 1, ['dest:s3', 'role_type:intermediary'])
      expect(incr).toHaveBeenCalledWith('sts_credential_cache_hit', 1, ['dest:s3', 'role_type:customer'])
    })

    it('does not throw when no statsContext is provided', async () => {
      mockStsSend.mockResolvedValue(stsOk())
      await expect(upload(newClient())).resolves.toBeDefined()
    })
  })
})
