import { Settings } from '../generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { S3Client, PutObjectCommandInput, PutObjectCommand, _Error as AWSError } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'
import * as process from 'process'
import { ErrorCodes, IntegrationError, RetryableError, APIError, RequestTimeoutError } from '@segment/actions-core'
import type { Features } from '@segment/actions-core'
import { Credentials } from './types'
import { S3_FILENAME_FIX_FLAG } from '../constants'

/**
 * Insert a timestamp suffix into the filename, immediately before the extension.
 *
 * If the prefix already ends with an extension (`.<fileExtension>` or any other
 * `.<ext>`-shaped suffix), the suffix is inserted just before it, replacing a mismatched
 * extension rather than doubling it (e.g. a `.txt` prefix with `file_extension: csv` becomes
 * `..._<date>.csv`, not `...txt_<date>.csv`); otherwise the suffix and extension are appended.
 * We strip the trailing extension by length/regex rather than `String.prototype.replace`,
 * because `replace` with a string replaces the FIRST occurrence of `fileExtension` anywhere
 * in the name (e.g. the leading "csv" in "csv_export.csv"), corrupting the filename.
 *
 * `filenamePrefix` is customer-controlled free text with no format validation, and becomes part
 * of the literal S3 object key — path separators and `..` segments are neutralized (replaced,
 * not rejected, so a customer's upload doesn't start failing) rather than passed through, as
 * defense in depth against path traversal / unexpected key injection.
 */
export function buildTimestampedFilename(filenamePrefix: string, dateSuffix: string, fileExtension: string): string {
  const safePrefix = filenamePrefix.replace(/[/\\]/g, '_').replace(/\.\./g, '_')
  const ext = `.${fileExtension}`
  const base = safePrefix.endsWith(ext)
    ? safePrefix.slice(0, safePrefix.length - ext.length)
    : safePrefix.replace(/\.[^./]+$/, '')
  return base ? `${base}_${dateSuffix}${ext}` : `${dateSuffix}${ext}`
}

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
    const result = await stsClient.send(command)
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
    features?: Features,
    signal?: AbortSignal
  ) {
    const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-')

    // Gated behind a feature flag (default off) for a gradual, per-workspace rollout after
    // STRATCONN-6986 / INC 20659 — this fix was part of the reverted release cluster.
    if (features?.[S3_FILENAME_FIX_FLAG]) {
      filename_prefix = buildTimestampedFilename(filename_prefix, dateSuffix, fileExtension)
    } else {
      // Flag off (default): original (buggy) behavior, kept as-is. `replace` with a string
      // replaces the FIRST occurrence of fileExtension anywhere in the name (e.g. the leading
      // "csv" in "csv_export.csv"), which can corrupt the filename — see STRATCONN-6988.
      if (filename_prefix.endsWith('.csv') || filename_prefix.endsWith('.txt')) {
        filename_prefix = filename_prefix.replace(fileExtension, `_${dateSuffix}.${fileExtension}`)
      } else {
        filename_prefix = filename_prefix
          ? `${filename_prefix}_${dateSuffix}.${fileExtension}`
          : `${dateSuffix}.${fileExtension}`
      }
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
