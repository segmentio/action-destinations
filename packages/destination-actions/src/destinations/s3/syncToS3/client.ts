import { Settings } from '../generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { S3Client, PutObjectCommandInput, PutObjectCommand, _Error as AWSError } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'
import * as process from 'process'
import { ErrorCodes, IntegrationError, RetryableError, APIError, RequestTimeoutError } from '@segment/actions-core'
import type { Features, StatsContext } from '@segment/actions-core'
import { LRUCache } from 'lru-cache'
import { Credentials } from './types'
import { CREDENTIALS_EXPIRY_BUFFER_MS } from './constants'
import { S3_STS_CREDENTIAL_CACHE_FLAG } from '../constants'

// Real deployments see at most a few hundred distinct (region, roleArn, externalId) combinations
// live at once; this is a generous cap that still bounds memory growth in a long-lived process.
const MAX_CACHE_ENTRIES = 1000

/**
 * Module-level STS credential cache, shared across every Client instance.
 *
 * A new Client is constructed on every upload (see syncToS3/functions.ts), so a per-instance
 * cache would never be reused. Under high-volume audience syncs the two-hop assume-role chain
 * (intermediary role -> customer role) re-ran STS on every file, which is the most likely source
 * of the `rate exceeded` / STS throttling errors seen during load testing. Caching the minted
 * credentials until just before their STS-reported expiry keeps STS call volume flat as the
 * number of files grows.
 *
 * Keyed by region + role ARN + external id, the inputs that determine the returned credentials.
 * Uses lru-cache (already a dependency, see hubspot's cache-functions.ts for the same pattern)
 * instead of a hand-rolled Map so both size (`max`) and per-entry expiry (`ttl`, set per-call to
 * each credential's actual STS-reported lifetime) are handled by a well-tested library rather
 * than bespoke eviction/expiry logic.
 */
const credentialsCache = new LRUCache<string, Credentials>({ max: MAX_CACHE_ENTRIES })

// De-dupes concurrent cache misses for the same key so a burst of concurrent uploads for a
// not-yet-cached role shares one in-flight AssumeRole call instead of each independently calling
// STS (which would otherwise reproduce the exact throttling this cache exists to prevent).
const inFlightAssumeRole = new Map<string, Promise<Credentials>>()

// Exposed for tests to reset the shared cache between cases.
export function clearCredentialsCache(): void {
  credentialsCache.clear()
  inFlightAssumeRole.clear()
}

// Builds a collision-safe cache key from the inputs that determine the returned credentials.
// JSON.stringify on an array safely escapes/quotes each element, so unlike naive string
// concatenation with a bare delimiter, two different (region, roleId, externalId) triples can
// never produce the same key — which matters because this cache is shared across every customer
// workspace in the process, so a colliding key would return one workspace's live AWS credentials
// to a different workspace.
//
// roleType is part of the key (not just a metric tag) because the intermediary role's ARN and
// external ID are effectively public — a customer must know them to configure their own role's
// trust policy. Without roleType in the key, a workspace could set its own iam_role_arn/
// iam_external_id equal to the intermediary's, forcing its "customer" hop to collide with the
// (always-populated-first) "intermediary" cache entry and receive Segment's own shared
// intermediary credentials without AWS ever checking its role's trust policy.
// externalId is intentionally not defaulted to '' by the caller: JSON.stringify serializes
// undefined array elements as `null`, which is distinguishable from the empty string, so an
// absent external id can never collide with an intentionally empty one.
function buildCacheKey(
  region: string,
  roleId: string,
  externalId: string | undefined,
  roleType: 'intermediary' | 'customer'
): string {
  return JSON.stringify([region, roleId, externalId, roleType])
}

// Increments a DataDog metric without letting a misbehaving stats client fail the upload it's
// only meant to be observing.
function safeIncr(statsClient: StatsContext['statsClient'] | undefined, metric: string, tags: string[]): void {
  try {
    statsClient?.incr(metric, 1, tags)
  } catch (err) {
    // Telemetry must never be able to fail the primary operation it's instrumenting, but a broken
    // stats client should still leave a trace so a silently-empty dashboard is diagnosable.
    console.warn('[s3] failed to emit metric', metric, err)
  }
}

export class Client {
  roleArn: string
  roleSessionName: string
  region: string
  externalId: string
  statsContext?: StatsContext
  features?: Features

  constructor(region: string, roleArn: string, externalId: string, statsContext?: StatsContext, features?: Features) {
    this.region = region
    this.roleSessionName = uuidv4()
    this.roleArn = roleArn
    this.externalId = externalId
    this.statsContext = statsContext
    this.features = features
  }

  async assumeRole(signal?: AbortSignal): Promise<Credentials> {
    const intermediaryARN = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS as string
    const intermediaryExternalId = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID as string
    const intermediaryCreds = await this.getSTSCredentials(
      intermediaryARN,
      intermediaryExternalId,
      'intermediary',
      undefined,
      signal
    )
    return this.getSTSCredentials(this.roleArn, this.externalId, 'customer', intermediaryCreds, signal)
  }

  private async getSTSCredentials(
    roleId: string,
    externalId: string,
    roleType: 'intermediary' | 'customer',
    credentials?: Credentials,
    signal?: AbortSignal
  ): Promise<Credentials> {
    // Tag every metric with the hop (intermediary vs customer role) so DataDog can break the
    // cache hit/miss counts down per hop of the two-hop assume-role chain.
    const tags = [...(this.statsContext?.tags ?? []), `role_type:${roleType}`]
    const statsClient = this.statsContext?.statsClient
    const cacheEnabled = Boolean(this.features?.[S3_STS_CREDENTIAL_CACHE_FLAG])
    const cacheKey = buildCacheKey(this.region, roleId, externalId, roleType)

    if (!cacheEnabled) {
      return this.assumeRoleUncached(roleId, externalId, roleType, credentials, signal)
    }

    // lru-cache purges an expired entry as soon as a get() finds it stale (default behavior), so
    // a cache miss here already means "absent or past its ttl" — no separate expiry check needed.
    const cached = credentialsCache.get(cacheKey)
    if (cached) {
      safeIncr(statsClient, 'sts_credential_cache_hit', tags)
      return cached
    }

    // De-dupe concurrent misses for the same key: if a fetch for this key is already in flight,
    // await and share that result instead of issuing a second concurrent AssumeRole call, which
    // would reproduce the exact STS-throttling problem this cache exists to prevent. The miss
    // metric is only emitted by the caller that actually kicks off a new fetch, below — a caller
    // that joins an in-flight fetch didn't cause a cache miss of its own to be resolved via STS.
    const existingInFlight = inFlightAssumeRole.get(cacheKey)
    if (existingInFlight) {
      return existingInFlight
    }
    safeIncr(statsClient, 'sts_credential_cache_miss', tags)

    const fetchPromise = this.assumeRoleUncached(roleId, externalId, roleType, credentials, signal).then(
      (creds) => {
        inFlightAssumeRole.delete(cacheKey)
        return creds
      },
      (err) => {
        inFlightAssumeRole.delete(cacheKey)
        throw err
      }
    )
    inFlightAssumeRole.set(cacheKey, fetchPromise)
    return fetchPromise
  }

  // Calls STS directly (no cache read) and, when the cache is enabled and STS returns a usable
  // Expiration, stores the result. Always the single place that actually talks to STS, whether
  // called from a cache miss or the cache-disabled path.
  private async assumeRoleUncached(
    roleId: string,
    externalId: string,
    roleType: 'intermediary' | 'customer',
    credentials?: Credentials,
    signal?: AbortSignal
  ): Promise<Credentials> {
    const cacheEnabled = Boolean(this.features?.[S3_STS_CREDENTIAL_CACHE_FLAG])
    const cacheKey = buildCacheKey(this.region, roleId, externalId, roleType)
    const options = { region: this.region, credentials }
    const stsClient = new STSClient(options)
    const command = new AssumeRoleCommand({
      RoleArn: roleId,
      RoleSessionName: this.roleSessionName,
      ExternalId: externalId
    })

    // Use the system-configured AbortSignal passed down from perform/performBatch (the same one
    // uploadS3 already passes to the S3 PutObject call below) rather than a bespoke timeout, so
    // STS respects the same cancellation the rest of the request honors.
    let result
    try {
      result = signal ? await stsClient.send(command, { abortSignal: signal }) : await stsClient.send(command)
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new RequestTimeoutError()
      }
      throw err
    }
    if (
      !result.Credentials ||
      !result.Credentials.AccessKeyId ||
      !result.Credentials.SecretAccessKey ||
      !result.Credentials.SessionToken
    ) {
      // TODO: Add more specific error handling
      throw new IntegrationError('Failed to assume role', ErrorCodes.INVALID_AUTHENTICATION, 403)
    }
    const creds: Credentials = {
      accessKeyId: result.Credentials.AccessKeyId,
      secretAccessKey: result.Credentials.SecretAccessKey,
      sessionToken: result.Credentials.SessionToken
    }

    if (cacheEnabled) {
      if (result.Credentials.Expiration) {
        // Cache the freshly minted credentials until shortly before STS says they expire. lru-cache
        // handles both the per-entry expiry (ttl) and the overall size bound (max, set at
        // construction) — no separate eviction bookkeeping needed.
        const ttl = result.Credentials.Expiration.getTime() - Date.now() - CREDENTIALS_EXPIRY_BUFFER_MS
        if (ttl > 0) {
          credentialsCache.set(cacheKey, creds, { ttl })
        }
        // ttl <= 0 means the credential is already within (or past) the expiry safety buffer —
        // not safe to cache, so skip storing it; the next request will fetch a fresh one.
      } else {
        // STS always returns Expiration in practice (the SDK types it optional, but the API
        // contract guarantees it; confirmed in DataDog it's always present). If it's ever missing,
        // fail safe rather than fail hard: skip caching this credential (so the next request fetches
        // a fresh one instead of reusing a credential of unknown lifetime) and still let this
        // request through with the credential STS just gave us. This metric should be alerted on —
        // a sustained non-zero rate means the caching feature is silently degrading back to calling
        // STS on every upload.
        const tags = [...(this.statsContext?.tags ?? []), `role_type:${roleType}`]
        safeIncr(this.statsContext?.statsClient, 'sts_credential_cache_skip_no_expiration', tags)
      }
    }

    return creds
  }

  async uploadS3(
    settings: Settings,
    fileContent: string | Buffer,
    filename_prefix: string,
    s3_aws_folder_name: string,
    fileExtension: string,
    signal?: AbortSignal
  ) {
    const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-')

    if (filename_prefix.endsWith('.csv') || filename_prefix.endsWith('.txt')) {
      // Insert the date suffix before the extension
      filename_prefix = filename_prefix.replace(fileExtension, `_${dateSuffix}.${fileExtension}`)
    } else {
      // Append the date suffix followed by the extension
      filename_prefix = filename_prefix
        ? `${filename_prefix}_${dateSuffix}.${fileExtension}`
        : `${dateSuffix}.${fileExtension}`
    }

    const bucketName = settings.s3_aws_bucket_name
    const folderName = ['', null, undefined].includes(s3_aws_folder_name)
      ? ''
      : s3_aws_folder_name?.endsWith('/')
      ? s3_aws_folder_name
      : `${s3_aws_folder_name}/`
    const credentials = await this.assumeRole(signal)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken
      }
    })
    const contentType = fileExtension === 'csv' ? 'text/csv' : 'text/plain'
    const objectKey = folderName ? `${folderName}${filename_prefix}` : filename_prefix
    const uploadParams: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
      ContentType: contentType
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await s3Client.send(new PutObjectCommand(uploadParams), { abortSignal: signal })
      return { statusCode: 200, message: 'Upload successful' }
    } catch (err) {
      // Handle abort signal error: https://aws.amazon.com/blogs/developer/abortcontroller-in-modular-aws-sdk-for-javascript/
      if ((err as Error).name === 'AbortError') {
        // Handle abort error
        throw new RequestTimeoutError()
      }

      if (isAWSError(err)) {
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-s3/Interface/_Error/
        if (err.Code && accessDeniedCodes.has(err.Code)) {
          throw new APIError(err.Message || err.Code, 403)
        } else if (err.Code === 'NoSuchBucket') {
          throw new APIError(err.Message || err.Code, 404)
        } else if (err.Code === 'SlowDown') {
          throw new APIError(err.Message || err.Code, 429)
        } else {
          throw new RetryableError(err.Message || err.Code || 'Unknown AWS Put error: ' + err)
        }
      } else {
        throw new APIError('Unknown error during AWS PUT: ' + err, 500)
      }
    }
  }
}

const accessDeniedCodes = new Set([
  'AccessDenied',
  'AccountProblem',
  'AllAccessDisabled',
  'InvalidAccessKeyId',
  'InvalidSecurity',
  'NotSignedUp',
  'AmbiguousGrantByEmailAddress',
  'AuthorizationHeaderMalformed',
  'RequestExpired'
])

// isAWSError validates that the error is an generic AWS error
export function isAWSError(err: unknown): err is AWSError {
  return typeof err === 'object' && err !== null && 'Code' in err && 'Message' in err
}
