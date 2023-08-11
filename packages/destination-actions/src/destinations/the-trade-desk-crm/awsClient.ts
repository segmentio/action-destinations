import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'

interface SendToAWSRequest {
  TDDAuthToken: string
  AdvertiserId: string
  CrmDataId: string
  SegmentName: string
  UsersFormatted: string
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
  SegmentName: string
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

const ACTION_SLUG = `actions-the-trade-desk-crm`

// Note: Clients are created in global scope to prevent client creation on every request
// Region and Segment Environment values are unique per Integrations Monoservice instance and will never change
const S3ClientInstance = new S3Client({ region: AWS_REGION })

const S3_BUCKET_NAME = `integrations-outbound-event-store-${NODE_ENV}-${AWS_REGION}`

export const sendEventToAWS = async (request: SendToAWSRequest) => {
  // Compute file path and message dedupe id
  // Each advertiser and segment can eventually have multiple data drops, we use uuid create unique files
  const uuidValue = uuidv4()
  const userdataFilePath = `${ACTION_SLUG}/${request.AdvertiserId}/${request.CrmDataId}/${uuidValue}.txt`
  const metadataFilePath = `${ACTION_SLUG}/${request.AdvertiserId}/${request.CrmDataId}/meta.json`

  // Create Metadata
  const metadata = JSON.stringify({
    TDDAuthToken: request.TDDAuthToken,
    AdvertiserId: request.AdvertiserId,
    SegmentName: request.SegmentName,
    CrmDataId: request.CrmDataId,
    DropOptions: request.DropOptions,
    RequeueCount: 0
  } as TTDEventPayload)

  // Upload user data to the S3 bucket
  const UploadUserdataS3Response = await S3ClientInstance.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: userdataFilePath,
      Body: request.UsersFormatted,
      ContentType: 'text/plain',
      // ContentLength Issue: https://stackoverflow.com/questions/68332633/aws-s3-node-js-sdk-notimplemented-error-with-multer
      ContentLength: request.UsersFormatted.length
    })
  )

  // Upload metadata to the S3 bucket
  const UploadMetadataS3Response = await S3ClientInstance.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: metadataFilePath,
      Body: metadata,
      ContentType: 'application/json',
      // ContentLength Issue: https://stackoverflow.com/questions/68332633/aws-s3-node-js-sdk-notimplemented-error-with-multer
      ContentLength: metadata.length
    })
  )

  return {
    UploadUserdataS3Response,
    UploadMetadataS3Response
  }
}
