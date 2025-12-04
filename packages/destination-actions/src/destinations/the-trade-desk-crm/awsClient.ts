import { v4 as uuidv4 } from '@lukeed/uuid'
import { getS3Client } from '../../lib/AWS/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

interface SendToAWSRequest {
  TDDAuthToken: string
  AdvertiserId: string
  CrmDataId: string
  UsersFormatted: string
  RowCount: number
  DropOptions: {
    PiiType: string
    MergeMode: string
    TtlInMinutes?: number
    RetentionEnabled?: boolean
  }
}

interface TTDEventPayload {
  TDDAuthToken: string
  AdvertiserId: string
  CrmDataId: string
  RequeueCount: number
  DropReferenceId?: string
  DropOptions: {
    PiiType: string
    MergeMode: string
    TtlInMinutes?: number
    RetentionEnabled?: boolean
  }
}

const NODE_ENV = process.env['NODE_ENV'] || `stage`
const AWS_REGION = process.env['AWS_REGION'] || `us-west-2`
const S3_BUCKET_NAME = `integrations-outbound-event-store-${NODE_ENV}-${AWS_REGION}`
const ACTION_SLUG = `actions-the-trade-desk-crm`

export const sendEventToAWS = async (input: SendToAWSRequest) => {
  // Compute file path and message dedupe id
  // Each advertiser and segment can eventually have multiple data drops, we use uuid create unique files
  const uuidValue = uuidv4()
  const userdataFilePath = `${ACTION_SLUG}/${input.AdvertiserId}/${input.CrmDataId}/${uuidValue}.txt`
  const metadataFilePath = `${ACTION_SLUG}/${input.AdvertiserId}/${input.CrmDataId}/meta.json`

  // Create Metadata
  const metadata = JSON.stringify({
    TDDAuthToken: input.TDDAuthToken,
    AdvertiserId: input.AdvertiserId,
    CrmDataId: input.CrmDataId,
    DropOptions: input.DropOptions,
    RequeueCount: 0
  } as TTDEventPayload)

  // Get S3 Client for Outbound Controller
  const s3Client = getS3Client('integrationsOutboundController')

  // Add Row Count to the File Chunk for Observability
  const urlEncodedTags = new URLSearchParams({
    row_count: `${input.RowCount}`
  }).toString()

  await Promise.all([
    // Upload user data to the S3 bucket
    s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: userdataFilePath,
        Body: input.UsersFormatted,
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
