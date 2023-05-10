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
