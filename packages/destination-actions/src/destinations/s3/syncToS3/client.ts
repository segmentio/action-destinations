import { Settings } from '../generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { S3Client, PutObjectCommandInput, PutObjectCommand, _Error as AWSError } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'
import * as process from 'process'
import { ErrorCodes, IntegrationError, RetryableError, APIError, RequestTimeoutError } from '@segment/actions-core'
import type { Features } from '@segment/actions-core'
import { Credentials } from './types'
import { S3_STS_ERROR_CLASSIFICATION_FLAG } from '../constants'

export class Client {
  roleArn: string
  roleSessionName: string
  region: string
  externalId: string
  features?: Features

  constructor(region: string, roleArn: string, externalId: string, features?: Features) {
    this.region = region
    this.roleSessionName = uuidv4()
    this.roleArn = roleArn
    this.externalId = externalId
    this.features = features
  }

  async assumeRole(): Promise<Credentials> {
    const intermediaryARN = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS as string
    const intermediaryExternalId = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID as string
    const intermediaryCreds = await this.getSTSCredentials(intermediaryARN, intermediaryExternalId, false)
    return this.getSTSCredentials(this.roleArn, this.externalId, true, intermediaryCreds)
  }

  private async getSTSCredentials(
    roleId: string,
    externalId: string,
    isCustomerRole: boolean,
    credentials?: Credentials
  ) {
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
        result = await stsClient.send(command)
      } catch (err) {
        // STS failures used to escape uploadS3's try/catch entirely, so they reached the platform
        // with no status/code, were classified type:internal and force-retried (even permanent auth
        // failures). Map them to Segment error classes here so classification is correct.
        if (!isCustomerRole) {
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
      result = await stsClient.send(command)
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
    return {
      accessKeyId: result.Credentials.AccessKeyId,
      secretAccessKey: result.Credentials.SecretAccessKey,
      sessionToken: result.Credentials.SessionToken
    }
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
    return new IntegrationError(detail, ErrorCodes.PAYLOAD_VALIDATION_FAILED, 400)
  }
  if (code && throttlingCodes.has(code)) {
    return new APIError(detail, 429)
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
    return new IntegrationError(detail, ErrorCodes.UNKNOWN_ERROR, 401)
  }
  if (code && transientClientCodes.has(code)) {
    // Despite carrying a 4xx status, AWS documents these as safe/recommended to retry
    // (e.g. OperationAborted: "a conflicting conditional operation is currently in progress
    // against this resource, please try again"; RequestTimeout: client-side upload stalled).
    return new RetryableError(detail)
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
