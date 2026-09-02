import { Settings } from '../generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { S3Client, PutObjectCommandInput, PutObjectCommand, _Error as AWSError } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'
import * as process from 'process'
import { ErrorCodes, IntegrationError, RetryableError, APIError, RequestTimeoutError } from '@segment/actions-core'
import { Credentials } from './types'

export class Client {
  roleArn: string
  roleSessionName: string
  region: string
  externalId: string

  constructor(region: string, roleArn: string, externalId: string) {
    this.region = region
    this.roleSessionName = uuidv4()
    this.roleArn = roleArn
    this.externalId = externalId
  }

  async assumeRole(): Promise<Credentials> {
    const intermediaryARN = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS as string
    const intermediaryExternalId = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID as string
    const intermediaryCreds = await this.getSTSCredentials(intermediaryARN, intermediaryExternalId)
    return this.getSTSCredentials(this.roleArn, this.externalId, intermediaryCreds)
  }

  private async getSTSCredentials(roleId: string, externalId: string, credentials?: Credentials) {
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
