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

export { validateS3, uploadS3 }
