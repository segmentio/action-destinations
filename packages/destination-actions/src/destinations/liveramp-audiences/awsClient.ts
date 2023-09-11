import { v4 as uuidv4 } from '@lukeed/uuid'
import aws4 from 'aws4'

import { RequestClient, InvalidAuthenticationError } from '@segment/actions-core'
import { getAWSCredentialsFromEKS, AWSCredentials } from '../../lib/AWS/sts'

import { ACTION_SLUG, LIVERAMP_SFTP_SERVER, LIVERAMP_SFTP_PORT } from './properties'

interface SendToAWSRequest {
  audienceKey: string
  uploadType: 's3' | 'sftp'
  filename: string
  fileContents: Buffer
  sftpInfo?: {
    sftpUsername?: string
    sftpPassword?: string
    sftpFolderPath?: string
  }
  s3Info?: {
    s3BucketName?: string
    s3Region?: string
    s3AccessKeyId?: string
    s3SecretAccessKey?: string
  }
}

interface LRMetaPayload {
  audienceKey: string
  uploadType: 's3' | 'sftp'
  filename: string
  sftpInfo?: {
    sftpHost: string
    sftpPort: number
    sftpUsername: string
    sftpPassword: string
    sftpFolderPath: string
  }
  s3Info?: {
    s3BucketName: string
    s3Region: string
    s3AccessKeyId: string
    s3SecretAccessKey: string
  }
}

interface UploadToAWSS3Input {
  request: RequestClient
  bucketName: string
  region: string
  fileContentType: string
  filePath: string
  fileContent: Buffer | string
  awsCredentials: AWSCredentials
}

const NODE_ENV = process.env['NODE_ENV'] || `stage`
const AWS_REGION = process.env['AWS_REGION'] || `us-west-2`
const S3_BUCKET_NAME = `integrations-outbound-event-store-${NODE_ENV}-${AWS_REGION}`

export const sendEventToAWS = async (request: RequestClient, input: SendToAWSRequest) => {
  // Compute file path and message dedupe id
  // Each advertiser and segment can eventually have multiple data drops, we use uuid create unique files
  const uuidValue = uuidv4()
  const userdataFilePath = `/${ACTION_SLUG}/${input.audienceKey}/${uuidValue}.csv`
  const metadataFilePath = `/${ACTION_SLUG}/${input.audienceKey}/meta.json`

  // Create Metadata
  const metadata: LRMetaPayload = {
    audienceKey: input.audienceKey,
    uploadType: input.uploadType,
    filename: input.filename
  }

  if (input.uploadType === 'sftp') {
    metadata.sftpInfo = {
      sftpHost: LIVERAMP_SFTP_SERVER,
      sftpPort: LIVERAMP_SFTP_PORT,
      sftpUsername: input.sftpInfo?.sftpUsername || '',
      sftpPassword: input.sftpInfo?.sftpPassword || '',
      sftpFolderPath: input.sftpInfo?.sftpFolderPath || ''
    }
  } else {
    metadata.s3Info = {
      s3BucketName: input.s3Info?.s3BucketName || '',
      s3Region: input.s3Info?.s3Region || '',
      s3AccessKeyId: input.s3Info?.s3AccessKeyId || '',
      s3SecretAccessKey: input.s3Info?.s3SecretAccessKey || ''
    }
  }

  const awsCredentials = await getAWSCredentialsFromEKS(request)

  // Upload user data to the S3 bucket
  await uploadToAWSS3({
    request,
    bucketName: S3_BUCKET_NAME,
    region: AWS_REGION,
    fileContentType: 'text/plain',
    filePath: userdataFilePath,
    fileContent: input.fileContents,
    awsCredentials: awsCredentials
  })

  // Upload metadata to the S3 bucket
  return uploadToAWSS3({
    request,
    bucketName: S3_BUCKET_NAME,
    region: AWS_REGION,
    fileContentType: 'application/json',
    filePath: metadataFilePath,
    fileContent: JSON.stringify(metadata),
    awsCredentials: awsCredentials
  })
}

async function uploadToAWSS3(input: UploadToAWSS3Input) {
  // Sign the AWS request
  const s3UploadRequest = aws4.sign(
    {
      host: `${input.bucketName}.s3.${input.region}.amazonaws.com`,
      path: input.filePath,
      body: input.fileContent,
      method: 'PUT',
      service: 's3',
      region: input.region,
      headers: {
        'Content-Type': input.fileContentType,
        Accept: 'application/json'
      }
    },
    {
      accessKeyId: input.awsCredentials.accessKeyId,
      secretAccessKey: input.awsCredentials.secretAccessKey,
      sessionToken: input.awsCredentials.sessionToken
    }
  )

  // Verify Signed Headers
  if (!s3UploadRequest.headers || !s3UploadRequest.method || !s3UploadRequest.host || !s3UploadRequest.path) {
    throw new InvalidAuthenticationError('Unable to generate signature header for AWS S3 request.')
  }

  // Upload file to S3
  return input.request(`https://${input.bucketName}.s3.${input.region}.amazonaws.com${input.filePath}`, {
    method: 'PUT',
    body: s3UploadRequest.body,
    headers: s3UploadRequest.headers as Record<string, string>
  })
}
