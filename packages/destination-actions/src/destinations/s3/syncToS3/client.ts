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
  PayloadValidationError
} from '@segment/actions-core'
import type { StatsContext } from '@segment/actions-core'
import { CachedCredentials, Credentials } from './types'
import { CREDENTIALS_EXPIRY_BUFFER_MS } from './constants'

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
 */
const credentialsCache = new Map<string, CachedCredentials>()

// Exposed for tests to reset the shared cache between cases.
export function clearCredentialsCache(): void {
  credentialsCache.clear()
}

// AWS enforces a hard limit of 1024 bytes (UTF-8) on S3 object keys.
const MAX_S3_OBJECT_KEY_BYTES = 1024

// AWS "safe" object-key characters (0-9 a-z A-Z and ! - _ . * ' ( )), plus '/' as the folder
// separator. See https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html.
// We reject keys containing anything outside this set rather than sanitizing — we never mutate
// customer-provided keys. The `u` flag makes matching operate on Unicode code points so a non-BMP
// character (e.g. an emoji) is reported as one character, not two surrogate halves.
const DISALLOWED_S3_OBJECT_KEY_CHARS = /[^A-Za-z0-9!\-_.*'()/]/gu

// Cap how many distinct offending characters we list per part, so a pathological key can't bloat
// the error message / logs.
const MAX_REPORTED_DISALLOWED_CHARS = 10

/**
 * Insert a timestamp suffix into the filename, immediately before the extension.
 *
 * If the prefix already ends with `.<fileExtension>`, the suffix is inserted just
 * before that extension; otherwise the suffix and extension are appended. We strip
 * the trailing extension by length rather than `String.prototype.replace`, because
 * `replace` with a string replaces the FIRST occurrence of `fileExtension` anywhere
 * in the name (e.g. the leading "csv" in "csv_export.csv"), corrupting the filename.
 */
export function buildTimestampedFilename(filenamePrefix: string, dateSuffix: string, fileExtension: string): string {
  const ext = `.${fileExtension}`
  if (filenamePrefix.endsWith(ext)) {
    const base = filenamePrefix.slice(0, filenamePrefix.length - ext.length)
    return `${base}_${dateSuffix}${ext}`
  }
  return filenamePrefix ? `${filenamePrefix}_${dateSuffix}${ext}` : `${dateSuffix}${ext}`
}

export class Client {
  roleArn: string
  roleSessionName: string
  region: string
  externalId: string
  statsContext?: StatsContext

  constructor(region: string, roleArn: string, externalId: string, statsContext?: StatsContext) {
    this.region = region
    this.roleSessionName = uuidv4()
    this.roleArn = roleArn
    this.externalId = externalId
    this.statsContext = statsContext
  }

  async assumeRole(): Promise<Credentials> {
    const intermediaryARN = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS as string
    const intermediaryExternalId = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID as string
    const intermediaryCreds = await this.getSTSCredentials(intermediaryARN, intermediaryExternalId, 'intermediary')
    return this.getSTSCredentials(this.roleArn, this.externalId, 'customer', intermediaryCreds)
  }

  private async getSTSCredentials(
    roleId: string,
    externalId: string,
    roleType: 'intermediary' | 'customer',
    credentials?: Credentials
  ): Promise<Credentials> {
    // Tag every metric with the hop (intermediary vs customer role) so DataDog can break the
    // cache hit/miss/set counts down per hop of the two-hop assume-role chain.
    const tags = [...(this.statsContext?.tags ?? []), `role_type:${roleType}`]
    const statsClient = this.statsContext?.statsClient

    const cacheKey = `${this.region}|${roleId}|${externalId ?? ''}`
    const cached = credentialsCache.get(cacheKey)
    if (cached && cached.expiration - CREDENTIALS_EXPIRY_BUFFER_MS > Date.now()) {
      statsClient?.incr('sts_credential_cache_hit', 1, tags)
      return cached.credentials
    }
    statsClient?.incr('sts_credential_cache_miss', 1, tags)

    const options = { region: this.region, credentials }
    const stsClient = new STSClient(options)
    const command = new AssumeRoleCommand({
      RoleArn: roleId,
      RoleSessionName: this.roleSessionName,
      ExternalId: externalId
    })
    let result
    try {
      result = await stsClient.send(command)
    } catch (err) {
      // STS failures used to escape uploadS3's try/catch entirely, so they reached the platform
      // with no status/code, were classified type:internal and force-retried (even permanent auth
      // failures). Map them to Segment error classes here so classification is correct.
      throw mapAWSError(err, 'Failed to assume AWS role')
    }
    // STS always returns all four fields on a successful AssumeRole (the SDK types them optional,
    // but the API contract guarantees them; verified in DataDog that Expiration is always present).
    // Treat a missing field as a malformed response and fail fast rather than cache blindly.
    if (
      !result.Credentials ||
      !result.Credentials.AccessKeyId ||
      !result.Credentials.SecretAccessKey ||
      !result.Credentials.SessionToken ||
      !result.Credentials.Expiration
    ) {
      // TODO: Add more specific error handling
      throw new IntegrationError('Failed to assume role', ErrorCodes.INVALID_AUTHENTICATION, 403)
    }
    const creds: Credentials = {
      accessKeyId: result.Credentials.AccessKeyId,
      secretAccessKey: result.Credentials.SecretAccessKey,
      sessionToken: result.Credentials.SessionToken
    }

    // Cache the freshly minted credentials until shortly before STS says they expire.
    credentialsCache.set(cacheKey, { credentials: creds, expiration: result.Credentials.Expiration.getTime() })
    statsClient?.incr('sts_credential_cache_set', 1, tags)

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

    filename_prefix = buildTimestampedFilename(filename_prefix, dateSuffix, fileExtension)

    const bucketName = settings.s3_aws_bucket_name
    const folderName = ['', null, undefined].includes(s3_aws_folder_name)
      ? ''
      : s3_aws_folder_name?.endsWith('/')
      ? s3_aws_folder_name
      : `${s3_aws_folder_name}/`
    const contentType = fileExtension === 'csv' ? 'text/csv' : 'text/plain'
    const objectKey = folderName ? `${folderName}${filename_prefix}` : filename_prefix

    // Reject over-long keys up front with a clear, non-retryable validation error, rather than
    // letting the PUT fail late and opaquely (and storm retries) with a raw AWS error.
    // Measure bytes, not characters: multi-byte UTF-8 chars count for more than one byte.
    const objectKeyBytes = Buffer.byteLength(objectKey, 'utf8')
    if (objectKeyBytes > MAX_S3_OBJECT_KEY_BYTES) {
      // Do not include the key content in the message — it may contain PII.
      throw new PayloadValidationError(
        `S3 object key exceeds the AWS limit of ${MAX_S3_OBJECT_KEY_BYTES} bytes (got ${objectKeyBytes} bytes). ` +
          `Shorten the folder name and/or filename prefix.`
      )
    }

    // Reject keys with characters outside AWS's safe set up front, rather than silently overwriting
    // a customer's prior files (key collisions) or failing late/opaquely at the PUT. Point at the
    // specific input(s) at fault and their distinct bad characters, but never echo the full value —
    // it may contain PII.
    const offending = (
      [
        ['folder name', folderName],
        ['filename prefix', filename_prefix]
      ] as const
    )
      .map(([label, value]) => {
        const bad = value.match(DISALLOWED_S3_OBJECT_KEY_CHARS)
        if (!bad) return null
        const distinct = [...new Set(bad)]
        const shown = distinct.slice(0, MAX_REPORTED_DISALLOWED_CHARS).map((c) => JSON.stringify(c))
        const more = distinct.length - shown.length
        const list = more > 0 ? `${shown.join(', ')}, …and ${more} more` : shown.join(', ')
        return `${label} has disallowed character(s): ${list}`
      })
      .filter((entry): entry is string => entry !== null)

    if (offending.length > 0) {
      throw new PayloadValidationError(
        `S3 object key contains characters outside the allowed set (A-Z a-z 0-9 / ! - _ . * ' ( )). ` +
          `${offending.join('; ')}.`
      )
    }

    const credentials = await this.assumeRole()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken
      }
    })
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

      throw mapAWSError(err, 'AWS PUT failed')
    }
  }
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
    $metadata?: { httpStatusCode?: number }
  }
  // S3 `_Error` uses Code/Message; STS/service exceptions use name/message.
  const code = e?.Code ?? e?.name
  const message = e?.Message ?? e?.message ?? code ?? String(err)
  const httpStatus = e?.$metadata?.httpStatusCode
  const detail = `${context}: ${message}`

  if (code && accessDeniedCodes.has(code)) {
    // Permanent authentication/authorization failure. Not retryable.
    return new APIError(detail, 403)
  }
  if (code === 'NoSuchBucket') {
    return new APIError(detail, 404)
  }
  if (code && throttlingCodes.has(code)) {
    return new APIError(detail, 429)
  }
  // A client fault (4xx that is not throttling) is permanent - do not retry.
  if (e?.$fault === 'client' || (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500)) {
    return new IntegrationError(detail, ErrorCodes.INVALID_AUTHENTICATION, httpStatus ?? 400)
  }
  // Transient / server-side / unclassified failures are safe to retry.
  return new RetryableError(detail)
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
  'RequestExpired',
  // STS assume-role authorization/credential failures
  'ExpiredToken',
  'ExpiredTokenException',
  'AccessDeniedException'
])

const throttlingCodes = new Set(['SlowDown', 'Throttling', 'ThrottlingException', 'TooManyRequestsException'])

// isAWSError validates that the error is an generic AWS error
export function isAWSError(err: unknown): err is AWSError {
  return typeof err === 'object' && err !== null && 'Code' in err && 'Message' in err
}
