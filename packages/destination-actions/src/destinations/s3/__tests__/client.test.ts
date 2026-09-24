import { Client, clearCredentialsCache, isAWSError } from '../syncToS3/client'
import { S3Client, _Error as AWSError } from '@aws-sdk/client-s3'
import type { Features, StatsContext } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { S3_STS_CREDENTIAL_CACHE_FLAG } from '../constants'
import { CREDENTIALS_EXPIRY_BUFFER_MS, STS_REQUEST_TIMEOUT_MS } from '../syncToS3/constants'

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

  // Client.assumeRole() reads these to build the intermediary hop; set them for real (rather than
  // leaving them undefined) so the intermediary hop's cache key/behavior in these tests matches
  // what a real deployment would see.
  const originalRoleAddress = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS
  const originalExternalId = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID
  beforeAll(() => {
    process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS = 'arn:aws:iam::555555555555:role/segment-intermediary'
    process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID = 'segment-intermediary-external-id'
  })
  afterAll(() => {
    process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS = originalRoleAddress
    process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID = originalExternalId
  })

  beforeEach(() => {
    mockStsSend.mockReset()
    ;(S3Client as unknown as jest.Mock).mockClear()
    clearCredentialsCache()
  })

  it('is off by default: calls STS on every upload without caching', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await upload(newClient())
    await upload(newClient())

    // No caching without the flag: each upload assumes both roles = 2 STS calls x 2 uploads.
    expect(mockStsSend).toHaveBeenCalledTimes(4)
  })

  // Regression: the STS request timeout added alongside the cache must not change flag-off
  // behavior. It was initially applied unconditionally, passing a second (options) argument and
  // an AbortSignal into every send() call -- including the disabled path -- which is not
  // byte-identical to main's plain `stsClient.send(command)` call.
  it('is off by default: calls STS with no timeout/abortSignal option (matches main)', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await upload(newClient())

    expect(mockStsSend).toHaveBeenCalledTimes(2)
    for (const call of mockStsSend.mock.calls) {
      expect(call).toHaveLength(1)
    }
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

  // Regression: the cache key used to be built via bare `${region}|${roleId}|${externalId}`
  // string concatenation, which is not injective — two different (roleArn, externalId) pairs could
  // produce the identical key, letting one workspace's request return a DIFFERENT workspace's live
  // AWS credentials from the shared cache. Two role/externalId pairs below are chosen so a naive
  // `|`-join of the customer values collides (roleArn contains a literal `|`), while the collision-
  // safe key must still treat them as distinct.
  it('when enabled, does NOT collide cache entries for role/externalId pairs that would collide under naive `|` concatenation', async () => {
    // Victim: roleArn = "role|secret1", externalId = "" — naive `${region}|${roleId}|${externalId}`
    // concatenation gives "region|role|secret1|".
    const victimClient = new Client(settings.s3_aws_region, 'role|secret1', '', undefined, cacheFlagOn)
    mockStsSend
      .mockResolvedValueOnce(stsResponse(60 * 60 * 1000, 'AKIA_INTERMEDIARY_1'))
      .mockResolvedValueOnce(stsResponse(60 * 60 * 1000, 'AKIA_VICTIM'))
    await upload(victimClient)

    // Attacker: roleArn = "role", externalId = "secret1|" — naive concatenation gives the SAME
    // string ("region|role|secret1|"). A colliding cache would return the victim's cached
    // CUSTOMER-hop credentials here instead of issuing a fresh (correctly-scoped) AssumeRole call.
    const attackerClient = new Client(settings.s3_aws_region, 'role', 'secret1|', undefined, cacheFlagOn)
    mockStsSend.mockResolvedValueOnce(stsResponse(60 * 60 * 1000, 'AKIA_ATTACKER'))
    const attackerResult = await upload(attackerClient)

    // The intermediary hop is legitimately shared (same env-derived role for both clients), so it's
    // a genuine cache hit on the second upload — only the customer hop should trigger a fresh STS
    // call. Total: victim's 2 (intermediary + customer) + attacker's 1 (customer only) = 3. If the
    // customer hop had instead collided with the victim's entry, this would be 2, not 3.
    expect(mockStsSend).toHaveBeenCalledTimes(3)
    expect(attackerResult).toBeDefined()
  })

  // Regression: the cache had no eviction, so every distinct (region, roleArn, externalId) ever
  // seen accumulated a permanent entry for the life of the process.
  it('when enabled, bounds cache size (lru-cache max) by evicting the least-recently-used entry once the cap is exceeded', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    // Fill the cache well past its cap with distinct customer roles (intermediary role is shared
    // and only counted once). Each entry is touched exactly once (at insert) and never read again
    // before the next insert, so under lru-cache's least-recently-used policy this is equivalent to
    // FIFO — the earliest-inserted, never-revisited entries get evicted first. The exact cap value
    // is an implementation detail; this only asserts that the cache does not grow without bound.
    const CAP_PROBE_COUNT = 1010
    for (let i = 0; i < CAP_PROBE_COUNT; i++) {
      await upload(newClient(`arn:aws:iam::123456789012:role/customer-${i}`, cacheFlagOn))
    }

    // The very first customer role's entry must have been evicted by now (least recently used),
    // so requesting it again must trigger a fresh STS call rather than a cache hit.
    const callsBeforeRefetch = mockStsSend.mock.calls.length
    await upload(newClient('arn:aws:iam::123456789012:role/customer-0', cacheFlagOn))
    expect(mockStsSend.mock.calls.length).toBeGreaterThan(callsBeforeRefetch)
  })

  // Regression: concurrent uploads for a not-yet-cached role each independently missed the cache
  // and independently called STS, reproducing the exact throttling ("rate exceeded") problem this
  // cache exists to prevent, under precisely the high-concurrency conditions where it matters most.
  it('when enabled, de-dupes concurrent cache misses for the same key into a single AssumeRole call per hop', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await Promise.all([
      upload(newClient(settings.iam_role_arn, cacheFlagOn)),
      upload(newClient(settings.iam_role_arn, cacheFlagOn)),
      upload(newClient(settings.iam_role_arn, cacheFlagOn))
    ])

    // All three concurrent uploads share one in-flight AssumeRole per hop = 2 STS calls total,
    // not 6 (3 uploads x 2 hops) as independent misses would produce.
    expect(mockStsSend).toHaveBeenCalledTimes(2)
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

  // Regression: the cache key used to omit roleType, so it was built purely from
  // (region, roleArn, externalId) — the same inputs used for BOTH the intermediary and customer
  // hops. The intermediary role's ARN/external-id are effectively public (a customer must know
  // them to configure their own role's trust policy), so a workspace could set its own
  // iam_role_arn/iam_external_id equal to the intermediary's, forcing its customer hop's cache
  // lookup to collide with the (always-populated-first) intermediary entry and receive Segment's
  // shared intermediary credentials without AWS ever checking the customer role's trust policy.
  it('when enabled, does not let a customer-configured role/externalId alias the intermediary hop\'s cache entry', async () => {
    // Attacker sets their own iam_role_arn/iam_external_id equal to the (effectively public)
    // intermediary role identity set up for the whole suite above, hoping the customer hop's
    // cache lookup collides with the intermediary hop's entry and returns its shared credentials.
    const attackerClient = new Client(
      settings.s3_aws_region,
      process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS as string,
      process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID as string,
      undefined,
      cacheFlagOn
    )
    mockStsSend
      .mockResolvedValueOnce(stsResponse(60 * 60 * 1000, 'AKIA_INTERMEDIARY'))
      .mockResolvedValueOnce(stsResponse(60 * 60 * 1000, 'AKIA_CUSTOMER_DISTINCT'))

    await upload(attackerClient)

    // Without roleType in the cache key, the customer hop would find the intermediary's entry
    // already cached and skip STS entirely (1 total call). The fix must keep the two hops in
    // separate cache namespaces even when their (region, roleArn, externalId) inputs match.
    expect(mockStsSend).toHaveBeenCalledTimes(2)
    const credentials = (S3Client as unknown as jest.Mock).mock.calls[0][0].credentials
    expect(credentials.accessKeyId).toBe('AKIA_CUSTOMER_DISTINCT')
  })

  it('when enabled, clears the in-flight entry on rejection so concurrent and subsequent callers are not stuck', async () => {
    mockStsSend.mockRejectedValueOnce(new Error('STS unavailable'))

    const results = await Promise.allSettled([
      upload(newClient(settings.iam_role_arn, cacheFlagOn)),
      upload(newClient(settings.iam_role_arn, cacheFlagOn))
    ])
    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('rejected')

    // If the in-flight entry weren't cleared on rejection, this would hang or reuse the stale
    // rejected promise forever instead of issuing a fresh AssumeRole call.
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))
    await expect(upload(newClient(settings.iam_role_arn, cacheFlagOn))).resolves.toBeDefined()
  })

  it('when enabled, does not cache and rejects when STS returns no usable Credentials, retrying fresh next time', async () => {
    mockStsSend
      .mockResolvedValueOnce(stsResponse(60 * 60 * 1000)) // intermediary hop succeeds
      .mockResolvedValueOnce({ Credentials: undefined }) // customer hop malformed

    await expect(upload(newClient(settings.iam_role_arn, cacheFlagOn))).rejects.toThrow('Failed to assume role')

    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))
    await expect(upload(newClient(settings.iam_role_arn, cacheFlagOn))).resolves.toBeDefined()
  })

  it('when enabled, times out and retries rather than hanging forever if STS never responds', async () => {
    jest.useFakeTimers()
    try {
      mockStsSend.mockImplementation((_cmd: unknown, opts?: { abortSignal?: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          opts?.abortSignal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      })

      const promise = upload(newClient(settings.iam_role_arn, cacheFlagOn))
      jest.advanceTimersByTime(STS_REQUEST_TIMEOUT_MS)

      await expect(promise).rejects.toThrow(/timed out/)
    } finally {
      jest.useRealTimers()
    }
  })

  it('when enabled, expires a cached credential once real time passes its ttl', async () => {
    // lru-cache tracks ttl internally via perf_hooks' performance.now(), which jest's fake timers
    // do not advance (they only affect Date/setTimeout), so this test uses a real, short-lived ttl
    // and waits in real time instead of faking the clock.
    const ttlMs = 20
    mockStsSend.mockResolvedValue(stsResponse(CREDENTIALS_EXPIRY_BUFFER_MS + ttlMs))

    await upload(newClient(settings.iam_role_arn, cacheFlagOn))
    expect(mockStsSend).toHaveBeenCalledTimes(2)

    await new Promise((resolve) => setTimeout(resolve, ttlMs + 100))

    await upload(newClient(settings.iam_role_arn, cacheFlagOn))
    // Both hops' cached entries have expired, so this upload must re-fetch from STS.
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
      new Client(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id, statsContext, cacheFlagOn)

    it('emits miss on first assume-role, hit on the second, tagged per role_type', async () => {
      mockStsSend.mockResolvedValue(stsOk())
      const { statsContext, incr } = makeStatsContext()

      // First upload: both hops miss. Second upload: both hops hit.
      await upload(clientWithStats(statsContext))
      await upload(clientWithStats(statsContext))

      const names = incr.mock.calls.map((c: unknown[]) => c[0])
      expect(names.filter((n: string) => n === 'sts_credential_cache_miss')).toHaveLength(2)
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
