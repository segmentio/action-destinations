import aws4 from 'aws4'

async function generateS3RequestOptions(bucketName, region, path, method, body, accessKeyId, secretAccessKey) {
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
