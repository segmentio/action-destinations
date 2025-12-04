import { S3Client } from '@aws-sdk/client-s3'
import aws4 from 'aws4'

async function generateS3RequestOptions(
  bucketName: string,
  region: string,
  path: string,
  method: string,
  body: string | Buffer,
  accessKeyId: string,
  secretAccessKey: string
) {
  const opts = {
    host: `${bucketName}.s3.amazonaws.com`,
    path,
    body,
    method,
    region
  }
  return aws4.sign(opts, {
    accessKeyId,
    secretAccessKey
  })
}

export default generateS3RequestOptions

const AWS_REGION = process.env['AWS_REGION'] || `us-west-2`

// To reduce the number of calls, we cache the S3 client instance on first creation.
// This cache is per instance of Integrations Monoservice.
// The Clients are initialized lazily on first request.
type S3ClientCache = {
  integrationsOutboundController?: S3Client
}

const s3ClientCache: S3ClientCache = {}

export const getS3Client = (targetService: keyof S3ClientCache): S3Client => {
  // Return if the client is available in cache
  if (s3ClientCache[targetService]) {
    return s3ClientCache[targetService]
  }

  // If your client needs to be initialized differently, you can add more conditions here

  const client = new S3Client({ region: AWS_REGION })
  s3ClientCache[targetService] = client
  return client
}
