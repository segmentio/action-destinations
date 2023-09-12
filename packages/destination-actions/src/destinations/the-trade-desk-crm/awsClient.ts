import { v4 as uuidv4 } from '@lukeed/uuid'
import aws4 from 'aws4'

import { RequestClient, InvalidAuthenticationError } from '@segment/actions-core'
import { getAWSCredentialsFromEKS, AWSCredentials } from '../../lib/AWS/sts'

interface SendToAWSRequest {
  TDDAuthToken: string
  AdvertiserId: string
  CrmDataId: string
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

interface UploadToAWSS3Input {
  request: RequestClient
  bucketName: string
  region: string
  fileContentType: string
  filePath: string
  fileContent: Buffer | string
  awsCredentials: AWSCredentials
}

const NODE_ENV = `stage`
const AWS_REGION = process.env['AWS_REGION'] || `us-west-2`
const S3_BUCKET_NAME = `integrations-outbound-event-store-${NODE_ENV}-${AWS_REGION}`
const ACTION_SLUG = `actions-the-trade-desk-crm`

export const sendEventToAWS = async (request: RequestClient, input: SendToAWSRequest) => {
  // Compute file path and message dedupe id
  // Each advertiser and segment can eventually have multiple data drops, we use uuid create unique files
  const uuidValue = uuidv4()
  const userdataFilePath = `/${ACTION_SLUG}/${input.AdvertiserId}/${input.CrmDataId}/${uuidValue}.txt`
  const metadataFilePath = `/${ACTION_SLUG}/${input.AdvertiserId}/${input.CrmDataId}/meta.json`

  // Create Metadata
  const metadata = JSON.stringify({
    TDDAuthToken: input.TDDAuthToken,
    AdvertiserId: input.AdvertiserId,
    CrmDataId: input.CrmDataId,
    DropOptions: input.DropOptions,
    RequeueCount: 0
  } as TTDEventPayload)

  const awsCredentials = await getAWSCredentialsFromEKS(request)

  // Upload user data to the S3 bucket
  await uploadToAWSS3({
    request,
    bucketName: S3_BUCKET_NAME,
    region: AWS_REGION,
    fileContentType: 'text/plain',
    filePath: userdataFilePath,
    fileContent: input.UsersFormatted,
    awsCredentials: awsCredentials
  })

  // Upload metadata to the S3 bucket
  return uploadToAWSS3({
    request,
    bucketName: S3_BUCKET_NAME,
    region: AWS_REGION,
    fileContentType: 'application/json',
    filePath: metadataFilePath,
    fileContent: metadata,
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
