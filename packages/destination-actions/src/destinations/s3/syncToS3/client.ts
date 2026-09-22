import { Settings } from '../generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { S3Client, PutObjectCommandInput, PutObjectCommand, _Error as AWSError } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'
import * as process from 'process'
import { ErrorCodes, IntegrationError, RetryableError, APIError, RequestTimeoutError } from '@segment/actions-core'
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
    const result = await stsClient.send(command)
    // STS always returns all four fields on a successful AssumeRole (the SDK types them optional,
    // but the API contract guarantees them; confirmed in DataDog that Expiration is always
    // present). Treat a missing field as a malformed response and fail fast rather than cache
    // a credential of unknown lifetime.
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
