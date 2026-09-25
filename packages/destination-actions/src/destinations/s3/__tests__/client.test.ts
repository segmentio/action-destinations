import { Client, clearCredentialsCache, isAWSError, mapAWSError } from '../syncToS3/client'
import { S3Client, _Error as AWSError } from '@aws-sdk/client-s3'
import {
  APIError,
  ErrorCodes,
  IntegrationError,
  RetryableError,
  RequestTimeoutError,
  PayloadValidationError,
  InvalidAuthenticationError
} from '@segment/actions-core'
import type { Features, StatsContext } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { S3_STS_ERROR_CLASSIFICATION_FLAG, S3_STS_CREDENTIAL_CACHE_FLAG } from '../constants'
import { CREDENTIALS_EXPIRY_BUFFER_MS } from '../syncToS3/constants'

// Controllable STS send mock so tests can control assume-role responses/failures.
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
    new Client('us-east-1', settings.iam_role_arn, settings.iam_external_id, undefined, features)
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
    new Client('us-east-1', settings.iam_role_arn, settings.iam_external_id, undefined, features)
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

  it('classifies throttling as a retryable 429', () => {
    const err = mapAWSError({ name: 'ThrottlingException', message: 'slow down' }, 'Failed to assume AWS role')
    expect(err).toBeInstanceOf(RetryableError)
    expect((err as RetryableError).status).toBe(429)
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
    expect(err).toBeInstanceOf(InvalidAuthenticationError)
    expect(err).not.toBeInstanceOf(RetryableError)
    expect((err as InvalidAuthenticationError).status).toBe(401)
    // Regression: a region mismatch is a config problem, not a credentials problem — must not be
    // stamped with INVALID_AUTHENTICATION, which would misdirect customers/on-call toward rotating
    // credentials instead of fixing s3_aws_region.
    expect((err as InvalidAuthenticationError).code).not.toBe(ErrorCodes.INVALID_AUTHENTICATION)
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

  // The object key (folder + filename_prefix) exceeded AWS's 1024-byte limit -- a workspace
  // configuration problem, not a transient failure. Classified as PAYLOAD_VALIDATION_FAILED
  // rather than falling into the generic unclassified-client-fault bucket.
  it('classifies KeyTooLongError as a non-retryable payload validation failure', () => {
    const err = mapAWSError({ Code: 'KeyTooLongError', Message: 'Your key is too long' }, 'AWS PUT failed')
    expect(err).toBeInstanceOf(PayloadValidationError)
    expect(err).not.toBeInstanceOf(RetryableError)
    expect((err as PayloadValidationError).status).toBe(400)
    expect((err as PayloadValidationError).code).toBe(ErrorCodes.PAYLOAD_VALIDATION_FAILED)
  })

  // Regression: these carry a 4xx status but AWS documents them as transient/safe to retry, so
  // they must not fall into the generic "4xx is permanent" branch. Surfaced as RequestTimeoutError
  // (a retryable timeout class) rather than the raw permanent client-fault bucket.
  it('treats OperationAborted (409) as a retryable timeout despite its 4xx status', () => {
    const err = mapAWSError(
      { Code: 'OperationAborted', Message: 'conflicting operation in progress', $fault: 'client', $metadata: { httpStatusCode: 409 } },
      'AWS PUT failed'
    )
    expect(err).toBeInstanceOf(RequestTimeoutError)
  })

  it('treats RequestTimeout (400) as a retryable timeout despite its 4xx status', () => {
    const err = mapAWSError(
      { Code: 'RequestTimeout', Message: 'upload stalled', $fault: 'client', $metadata: { httpStatusCode: 400 } },
      'AWS PUT failed'
    )
    expect(err).toBeInstanceOf(RequestTimeoutError)
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
    // mockS3Send is shared across describe blocks in this file, so reset it here and default it to a
    // successful PUT — the caching tests exercise the full uploadS3 path and only assert on STS.
    mockS3Send.mockReset()
    mockS3Send.mockResolvedValue({})
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

  // The same AbortSignal that perform/performBatch pass into uploadS3 (and that already cancels
  // the S3 PutObject call) is also forwarded into every STS AssumeRole call, on both hops,
  // regardless of the cache flag -- there's no per-caller dedup/sharing to worry about, so this
  // is a plain pass-through with no bespoke timeout or error conversion.
  it('forwards the caller-provided AbortSignal into every STS call', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))
    const controller = new AbortController()

    await newClient().uploadS3(settings, 'content', 'file', '', 'csv', controller.signal)

    expect(mockStsSend).toHaveBeenCalledTimes(2)
    for (const call of mockStsSend.mock.calls) {
      expect(call[1]).toEqual({ abortSignal: controller.signal })
    }
  })

  it('calls STS with an abortSignal option of undefined when no signal was passed to uploadS3', async () => {
    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))

    await upload(newClient())

    expect(mockStsSend).toHaveBeenCalledTimes(2)
    for (const call of mockStsSend.mock.calls) {
      expect(call[1]).toEqual({ abortSignal: undefined })
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

  it('when enabled, does not cache and rejects when STS returns no usable Credentials, retrying fresh next time', async () => {
    mockStsSend
      .mockResolvedValueOnce(stsResponse(60 * 60 * 1000)) // intermediary hop succeeds
      .mockResolvedValueOnce({ Credentials: undefined }) // customer hop malformed

    await expect(upload(newClient(settings.iam_role_arn, cacheFlagOn))).rejects.toThrow('Failed to assume role')

    mockStsSend.mockResolvedValue(stsResponse(60 * 60 * 1000))
    await expect(upload(newClient(settings.iam_role_arn, cacheFlagOn))).resolves.toBeDefined()
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
