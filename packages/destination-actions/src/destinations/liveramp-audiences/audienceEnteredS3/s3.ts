import generateS3RequestOptions from '../../../lib/AWS/s3'
import { InvalidAuthenticationError, ModifiedResponse, RequestOptions } from '@segment/actions-core'
import { Payload } from './generated-types'

function validateS3(payload: Payload) {
  if (!payload.s3_aws_access_key) {
    throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS Access Key')
  }

  if (!payload.s3_aws_secret_key) {
    throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS Secret Key')
  }

  if (!payload.s3_aws_bucket_name) {
    throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS S3 bucket name')
  }

  if (!payload.s3_aws_region) {
    throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS Region')
  }
}

async function uploadS3(
  payload: Payload,
  filename: string,
  fileContent: Buffer,
  request: <Data = unknown>(url: string, options?: RequestOptions) => Promise<ModifiedResponse<Data>>
) {
  const method = 'PUT'
  const opts = await generateS3RequestOptions(
    payload.s3_aws_bucket_name as string,
    payload.s3_aws_region as string,
    filename,
    method,
    fileContent,
    payload.s3_aws_access_key as string,
    payload.s3_aws_secret_key as string
  )
  if (!opts.headers || !opts.method || !opts.host || !opts.path) {
    throw new InvalidAuthenticationError('Unable to generate signature header for AWS S3 request.')
  }

  return await request(`https://${opts.host}/${opts.path}`, {
    headers: opts.headers as Record<string, string>,
    method,
    body: opts.body
  })
}

/**
 * Checks whether the provided string is a valid S3 object key path.
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html#object-key-choose
 *
 * @param key - The S3 object key path to validate.
 * @returns `true` if the key is valid according to the above rules, otherwise `false`.
 */
function isValidS3Path(key: string): boolean {
  const encoder = new TextEncoder()
  const byteLength = encoder.encode(key).length
  if (byteLength > 1024 || key.trim() === '') {
    return false
  }

  const forbiddenChars = new Set(['\\', '{', '}', '^', '[', ']', '%', '`', '"', '<', '>', '#', '|', '~'])

  for (let i = 0; i < key.length; i++) {
    const charCode = key.charCodeAt(i)

    if ((charCode >= 0 && charCode <= 31) || (charCode >= 128 && charCode <= 255)) {
      return false
    }

    if (forbiddenChars.has(key[i])) {
      return false
    }
  }

  return true
}

/**
 * Normalizes an S3 path by removing any leading or trailing slashes.
 *
 * @param path - The S3 path to normalize. Can be undefined.
 * @returns The normalized S3 path without leading or trailing slashes, or undefined if the input is undefined.
 */
function normalizeS3Path(path?: string): string | undefined {
  return path?.replace(/^\/+|\/+$/g, '')
}

export { validateS3, uploadS3, isValidS3Path, normalizeS3Path }
