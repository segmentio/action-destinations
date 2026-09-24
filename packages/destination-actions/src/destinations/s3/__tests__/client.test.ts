import { Client, clearCredentialsCache, isAWSError } from '../syncToS3/client'
import { S3Client, _Error as AWSError } from '@aws-sdk/client-s3'
import type { Features, StatsContext } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { S3_STS_CREDENTIAL_CACHE_FLAG } from '../constants'

// Controllable STS send mock so the caching tests can control credential responses.
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

describe('STS credential caching', () => {
  const settings: Settings = {
    iam_role_arn: 'arn:aws:iam::123456789012:role/test',
    s3_aws_bucket_name: 'test-bucket',
    s3_aws_region: 'us-east-1',
    iam_external_id: 'external-id'
  }

  // A minimal successful AssumeRole response whose credentials expire `expiresInMs` from now.
  // `accessKeyId` is overridable so tests can assert on which hop's credentials actually get used.
  const stsResponse = (expiresInMs: number, accessKeyId = 'AKIAEXAMPLE') => ({
    Credentials: {
      AccessKeyId: accessKeyId,
      SecretAccessKey: 'secret',
      SessionToken: 'token',
      Expiration: new Date(Date.now() + expiresInMs)
    }
  })

  const cacheFlagOn: Features = { [S3_STS_CREDENTIAL_CACHE_FLAG]: true }

  const newClient = (roleArn = settings.iam_role_arn, features?: Features) =>
    new Client(settings.s3_aws_region, roleArn, settings.iam_external_id, undefined, features)
  const upload = (client: Client) => client.uploadS3(settings, 'content', 'file', '', 'csv')

  beforeEach(() => {
    mockStsSend.mockReset()
    clearCredentialsCache()
  })

  it('is off by default: calls STS on every upload without caching', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await upload(newClient())
    await upload(newClient())

    // No caching without the flag: each upload assumes both roles = 2 STS calls x 2 uploads.
    expect(mockStsSend).toHaveBeenCalledTimes(4)
  })

  it('when enabled, reuses cached credentials across uploads instead of re-calling STS for every file', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await upload(newClient(settings.iam_role_arn, cacheFlagOn))
    await upload(newClient(settings.iam_role_arn, cacheFlagOn))

    // First upload assumes both roles (intermediary + customer) = 2 STS calls.
    // Second upload finds both cached = 0 STS calls.
    expect(mockStsSend).toHaveBeenCalledTimes(2)
  })

  it('when enabled, a cache hit actually returns the cached CUSTOMER-hop credentials to S3Client, not the intermediary hop\'s', async () => {
    // Distinguishable per-hop credentials so a cache-key mixup (e.g. customer lookup returning the
    // intermediary's cached entry) would be caught by asserting the exact values used, not just call counts.
    mockStsSend
      .mockResolvedValueOnce(stsResponse(60 * 60 * 1000, 'AKIA_INTERMEDIARY'))
      .mockResolvedValueOnce(stsResponse(60 * 60 * 1000, 'AKIA_CUSTOMER'))

    await upload(newClient(settings.iam_role_arn, cacheFlagOn))
    const firstCallCredentials = (S3Client as unknown as jest.Mock).mock.calls[0][0].credentials
    expect(firstCallCredentials.accessKeyId).toBe('AKIA_CUSTOMER')

    // Second upload: both hops are cache hits (0 further STS calls) — verify the SAME correct,
    // per-hop credentials are what actually get used, not just that STS wasn't re-called.
    ;(S3Client as unknown as jest.Mock).mockClear()
    await upload(newClient(settings.iam_role_arn, cacheFlagOn))
    expect(mockStsSend).toHaveBeenCalledTimes(2) // still just the first upload's 2 calls
    const secondCallCredentials = (S3Client as unknown as jest.Mock).mock.calls[0][0].credentials
    expect(secondCallCredentials.accessKeyId).toBe('AKIA_CUSTOMER')
  })

  it('when enabled, refreshes credentials once they fall within the expiry safety buffer', async () => {
    // Expires in 1 minute, inside the 5-minute refresh buffer -> never safe to cache.
    mockStsSend.mockResolvedValue(stsResponse(60 * 1000))

    await upload(newClient(settings.iam_role_arn, cacheFlagOn))
    await upload(newClient(settings.iam_role_arn, cacheFlagOn))

    expect(mockStsSend).toHaveBeenCalledTimes(4)
  })

  it('when enabled, caches per role identity while sharing the intermediary role', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await upload(newClient('arn:aws:iam::123456789012:role/test', cacheFlagOn))
    await upload(newClient('arn:aws:iam::999999999999:role/other', cacheFlagOn))

    // Intermediary role assumed once (shared), plus one customer assume-role per distinct ARN = 3.
    expect(mockStsSend).toHaveBeenCalledTimes(3)
  })

  it('when enabled, does not cache a credential missing an expiration, and fetches fresh next time', async () => {
    // Fail safe, not fail hard: a credential we can't safely cache (unknown lifetime) should still
    // let the current request through — it just shouldn't be cached, so the next request goes back
    // to STS instead of reusing a credential of unknown lifetime forever.
    mockStsSend.mockResolvedValue({
      Credentials: { AccessKeyId: 'AKIA', SecretAccessKey: 'secret', SessionToken: 'token' }
    })

    await expect(upload(newClient(settings.iam_role_arn, cacheFlagOn))).resolves.toBeDefined()
    await expect(upload(newClient(settings.iam_role_arn, cacheFlagOn))).resolves.toBeDefined()

    // Neither upload's credentials (missing Expiration) were cacheable, so both uploads assume
    // both roles from scratch = 2 STS calls x 2 uploads.
    expect(mockStsSend).toHaveBeenCalledTimes(4)
  })

  it('is off by default: does NOT fail when STS returns credentials without an expiration (matches main)', async () => {
    // Regression guard: the Expiration requirement must be gated behind the cache flag. main never
    // checked Expiration, so flag-off must keep succeeding even when STS omits it.
    mockStsSend.mockResolvedValue({
      Credentials: { AccessKeyId: 'AKIA', SecretAccessKey: 'secret', SessionToken: 'token' }
    })

    await expect(upload(newClient())).resolves.toBeDefined()
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
      new Client(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id, statsContext, cacheFlagOn)

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
