import { Settings } from '../generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { S3Client, PutObjectCommandInput, PutObjectCommand, _Error as AWSError } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'
import * as process from 'process'
import {
  ErrorCodes,
  IntegrationError,
  RetryableError,
  APIError,
  RequestTimeoutError,
  PayloadValidationError,
  InvalidAuthenticationError
} from '@segment/actions-core'
import type { Features, StatsContext } from '@segment/actions-core'
import { LRUCache } from 'lru-cache'
import { Credentials } from './types'
import { CREDENTIALS_EXPIRY_BUFFER_MS } from './constants'
import { S3_STS_ERROR_CLASSIFICATION_FLAG, S3_STS_CREDENTIAL_CACHE_FLAG } from '../constants'

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

// Exposed for tests to reset the shared cache between cases.
export function clearCredentialsCache(): void {
  credentialsCache.clear()
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

    if (!cacheEnabled) {
      return this.assumeRoleUncached(roleId, externalId, roleType, credentials, signal)
    }

    // lru-cache purges an expired entry as soon as a get() finds it stale (default behavior), so
    // a cache miss here already means "absent or past its ttl" — no separate expiry check needed.
    const cacheKey = buildCacheKey(this.region, roleId, externalId, roleType)
    const cached = credentialsCache.get(cacheKey)
    if (cached) {
      safeIncr(statsClient, 'sts_credential_cache_hit', tags)
      return cached
    }
    safeIncr(statsClient, 'sts_credential_cache_miss', tags)
    return this.assumeRoleUncached(roleId, externalId, roleType, credentials, signal)
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
    const options = { region: this.region, credentials }
    const stsClient = new STSClient(options)
    const command = new AssumeRoleCommand({
      RoleArn: roleId,
      RoleSessionName: this.roleSessionName,
      ExternalId: externalId
    })
    let result
    if (this.features?.[S3_STS_ERROR_CLASSIFICATION_FLAG]) {
      try {
        result = await stsClient.send(command, { abortSignal: signal })
      } catch (err) {
        // STS failures used to escape uploadS3's try/catch entirely, so they reached the platform
        // with no status/code, were classified type:internal and force-retried (even permanent auth
        // failures). Map them to Segment error classes here so classification is correct.
        if (roleType === 'intermediary') {
          // This is Segment's own internal bridging role (not the customer's), so a failure here
          // reflects Segment-side infrastructure, not a customer misconfiguration. Always treat it
          // as retryable rather than applying the customer-facing classification below, which could
          // otherwise permanently reject a transient internal failure (e.g. AccessDeniedException)
          // and drop an otherwise-recoverable event.
          throw new RetryableError(`Failed to assume intermediary AWS role: ${errorMessage(err)}`)
        }
        throw mapAWSError(err, 'Failed to assume AWS role')
      }
    } else {
      // Flag off (default): original behavior — STS errors are not wrapped and escape unclassified.
      // Kept as-is for a gradual rollout after STRATCONN-6986 / INC 20659.
      result = await stsClient.send(command, { abortSignal: signal })
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
          const cacheKey = buildCacheKey(this.region, roleId, externalId, roleType)
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

      if (this.features?.[S3_STS_ERROR_CLASSIFICATION_FLAG]) {
        throw mapAWSError(err, 'AWS PUT failed')
      }

      // Flag off (default): original inline classification, kept as-is for a gradual rollout
      // after STRATCONN-6986 / INC 20659.
      if (isAWSError(err)) {
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-s3/Interface/_Error/
        if (err.Code && legacyAccessDeniedCodes.has(err.Code)) {
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

// Extracts a plain message from any thrown value, for use in contexts (like the intermediary-role
// retry path) that don't go through the full mapAWSError classification.
function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Maps an AWS SDK error (S3 `_Error` shape or an STS/service exception) to the appropriate
 * Segment error class. Permanent, client-side failures (access denied, invalid config, expired
 * credentials, missing bucket) are surfaced as non-retryable errors; only transient/server-side
 * or throttling failures are marked retryable. This prevents the platform from force-retrying
 * errors that will never succeed.
 */
export function mapAWSError(err: unknown, context: string): Error {
  const e = err as {
    Code?: string
    Message?: string
    name?: string
    message?: string
    $fault?: 'client' | 'server'
    $metadata?: { httpStatusCode?: number; requestId?: string }
  }
  // S3 `_Error` uses Code/Message; STS/service exceptions use name/message.
  const code = e?.Code ?? e?.name
  const message = e?.Message ?? e?.message ?? code ?? String(err)
  const httpStatus = e?.$metadata?.httpStatusCode
  const requestId = e?.$metadata?.requestId
  // Preserve the AWS request id when available so an incident 6 months from now can still
  // correlate this classified error back to the specific AWS request that failed.
  const detail = `${context}: ${message}${requestId ? ` (AWS requestId: ${requestId})` : ''}`

  if (code && accessDeniedCodes.has(code)) {
    // Permanent authentication/authorization failure. Not retryable.
    return new APIError(detail, 403)
  }
  if (code === 'NoSuchBucket') {
    return new APIError(detail, 404)
  }
  if (code === 'KeyTooLongError') {
    // The assembled object key (folder + filename_prefix, post timestamp/extension) exceeds AWS's
    // 1024-byte object-key limit. This is a workspace configuration problem (filename_prefix/folder
    // settings), not a transient failure — classify it as a payload validation failure rather than
    // falling through to the generic unclassified-client-fault bucket below. AWS's own message
    // ("Your key is too long") doesn't include the offending key, so it's safe to surface as-is.
    return new PayloadValidationError(detail)
  }
  if (code && throttlingCodes.has(code)) {
    return new RetryableError(detail, 429)
  }
  if (code && redirectCodes.has(code)) {
    // S3 returns a redirect (e.g. PermanentRedirect, HTTP 301) when the bucket lives in a
    // different region than configured. It's a permanent client misconfiguration — NOT a
    // credentials problem — so use a neutral error code rather than INVALID_AUTHENTICATION
    // (which would incorrectly point customers/on-call at their credentials instead of the
    // s3_aws_region setting). Still surfaced as non-retryable 401 rather than leaking the raw
    // 3xx redirect status.
    // Note: TemporaryRedirect (bucket mid-migration) and PermanentRedirect (fixed misconfiguration)
    // are intentionally collapsed into the same non-retryable bucket here — a normal retry window
    // won't resolve either, even though their root causes differ.
    return new InvalidAuthenticationError(detail, ErrorCodes.UNKNOWN_ERROR)
  }
  if (code && transientClientCodes.has(code)) {
    // Despite carrying a 4xx status, AWS documents these as safe/recommended to retry
    // (e.g. OperationAborted: "a conflicting conditional operation is currently in progress
    // against this resource, please try again"; RequestTimeout: client-side upload stalled).
    return new RequestTimeoutError(detail)
  }
  // A client fault (4xx that is not throttling/transient) is permanent - do not retry.
  if (e?.$fault === 'client' || (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500)) {
    // Only ever surface a genuine 4xx as the status; never leak a non-4xx (e.g. a 3xx redirect).
    const status = typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500 ? httpStatus : 400
    // Not necessarily an auth problem — just an unclassified client-side failure — so use a
    // neutral error code rather than mislabeling it as an authentication issue.
    return new IntegrationError(detail, ErrorCodes.UNKNOWN_ERROR, status)
  }
  // Transient / server-side / unclassified failures are safe to retry.
  return new RetryableError(detail)
}

// Original (pre-classification) access-denied code set, used only on the flag-off path so that
// disabling S3_STS_ERROR_CLASSIFICATION_FLAG restores the exact prior behavior.
const legacyAccessDeniedCodes = new Set([
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

const accessDeniedCodes = new Set([
  'AccessDenied',
  'AccountProblem',
  'AllAccessDisabled',
  'InvalidAccessKeyId',
  'InvalidSecurity',
  'NotSignedUp',
  'AmbiguousGrantByEmailAddress',
  'AuthorizationHeaderMalformed',
  'RequestExpired',
  // STS assume-role authorization/credential failures
  'ExpiredToken',
  'ExpiredTokenException',
  'AccessDeniedException'
])

const throttlingCodes = new Set(['SlowDown', 'Throttling', 'ThrottlingException', 'TooManyRequestsException'])

// Region mismatch: S3 returns a 3xx redirect when the bucket is in a different region than configured.
const redirectCodes = new Set(['PermanentRedirect', 'TemporaryRedirect'])

// AWS documents these as transient despite carrying a 4xx status — safe (and recommended) to retry.
const transientClientCodes = new Set(['OperationAborted', 'RequestTimeout'])

// isAWSError validates that the error is an generic AWS error
export function isAWSError(err: unknown): err is AWSError {
  return typeof err === 'object' && err !== null && 'Code' in err && 'Message' in err
}
