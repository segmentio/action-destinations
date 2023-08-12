import generateS3RequestOptions from '../../../lib/AWS/s3'
import { InvalidAuthenticationError, ModifiedResponse, RequestOptions } from '@segment/actions-core'
import { Settings } from '../generated-types'

async function putS3(
  settings: Settings,
  filename: string,
  fileContent: string,
  request: <Data = unknown>(url: string, options?: RequestOptions) => Promise<ModifiedResponse<Data>>
) {
  const method = 'PUT'
  const opts = await generateS3RequestOptions(
    settings.s3_bucket as string,
    settings.s3_region as string,
    filename,
    method,
    fileContent,
    settings.s3_access_key as string,
    settings.s3_secret as string
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

export { putS3 }
