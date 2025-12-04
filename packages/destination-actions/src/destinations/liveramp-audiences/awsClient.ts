import { v4 as uuidv4 } from '@lukeed/uuid'
import { getS3Client } from '../../lib/AWS/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

import { ACTION_SLUG, LIVERAMP_SFTP_SERVER, LIVERAMP_SFTP_PORT } from './properties'

interface SendToAWSRequest {
  audienceComputeId?: string
  destinationInstanceID?: string
  subscriptionId?: string
  uploadType: 's3' | 'sftp'
  filename: string
  fileContents: Buffer
  rowCount: number
  gzipCompressFile?: boolean
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
    s3BucketPath?: string
  }
}

interface LRMetaPayload {
  audienceKey: string
  uploadType: 's3' | 'sftp'
  filename: string
  gzipCompressFile?: boolean
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
    s3BucketPath?: string
  }
}

const NODE_ENV = process.env['NODE_ENV'] || `stage`
const AWS_REGION = process.env['AWS_REGION'] || `us-west-2`
const S3_BUCKET_NAME = `integrations-outbound-event-store-${NODE_ENV}-${AWS_REGION}`

export const sendEventToAWS = async (input: SendToAWSRequest) => {
  // Compute file path and message dedupe id
  // Each advertiser and segment can eventually have multiple data drops, we use uuid create unique files
  const uuidValue = uuidv4()

  const aggreagtedFilePath =
    `${input.destinationInstanceID ?? ''}${input.subscriptionId ? '/' + input.subscriptionId : ''}${
      input.audienceComputeId ? '/' + input.audienceComputeId : ''
    }`.replace(/^\/+|\/+$/g, '') || ''

  const userdataFilePath = `${ACTION_SLUG}/${aggreagtedFilePath}/${uuidValue}.csv`
  const metadataFilePath = `${ACTION_SLUG}/${aggreagtedFilePath}/meta.json`

  // Create Metadata
  const metadata: LRMetaPayload = {
    audienceKey: input.audienceComputeId || '',
    uploadType: input.uploadType,
    filename: input.filename,
    gzipCompressFile: input.gzipCompressFile
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
      s3SecretAccessKey: input.s3Info?.s3SecretAccessKey || '',
      s3BucketPath: input.s3Info?.s3BucketPath || ''
    }
  }

  // Get S3 Client for Outbound Controller
  const s3Client = getS3Client('integrationsOutboundController')

  // Add Row Count to the File Chunk for Observability
  const urlEncodedTags = new URLSearchParams({
    row_count: `${input.rowCount}`
  }).toString()

  await Promise.all([
    // Upload user data to the S3 bucket
    s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: userdataFilePath,
        Body: input.fileContents,
        ContentType: 'text/csv',
        Tagging: urlEncodedTags
      })
    ),

    // Upload metadata to the S3 bucket
    s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: metadataFilePath,
        Body: JSON.stringify(metadata),
        ContentType: 'application/json'
      })
    )
  ])
}
