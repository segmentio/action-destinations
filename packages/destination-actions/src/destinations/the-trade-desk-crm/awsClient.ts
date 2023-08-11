import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { v4 as uuidv4 } from '@lukeed/uuid'
import { Readable } from 'stream'

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
interface SQSMessageBody {
  EventUUID: string
  TDDAuthToken: string
  AdvertiserId: string
  CrmDataId: string
  SegmentName: string
  S3FilePath: string
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
const AWS_ACCOUNT_ID = parseARN(process.env['AWS_ROLE_ARN'])

const ACTION_SLUG = `actions-the-trade-desk-crm`

// Note: Clients are created in global scope to prevent client creation on every request
// Region and Segment Environment values are unique per Integrations Monoservice instance and will never change
const S3ClientInstance = new S3Client({ region: AWS_REGION })
const SQSClientInstance = new SQSClient({ region: AWS_REGION })

const S3_BUCKET_NAME = `integrations-outbound-event-store-${NODE_ENV}-${AWS_REGION}`
const SQS_QUEUE_NAME = `integrations-outbound-event-queue-${NODE_ENV}-${AWS_REGION}.fifo`
const SQS_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/${SQS_QUEUE_NAME}`

export const sendEventToAWS = async (request: SendToAWSRequest) => {
  // Compute file path and message dedupe id
  // Each advertiser and segment can eventually have multiple data drops, we use uuid create unique files
  const uuidValue = uuidv4()
  const S3FilePath = `${ACTION_SLUG}/outbound/${request.CrmDataId}-${uuidValue}.txt`
  const MessageDeduplicationId = `${request.CrmDataId}-${uuidValue}`

  // Create Queue Message Payload
  // Store almost all of the S3Payload in the SQS message, this prevents fetching and parsing
  // payload from S3 before concurrent operations in the same CRM Data Segment is complete
  const SQSPayload: SQSMessageBody = {
    EventUUID: uuidValue,
    TDDAuthToken: request.TDDAuthToken,
    AdvertiserId: request.AdvertiserId,
    CrmDataId: request.CrmDataId,
    SegmentName: request.SegmentName,
    DropOptions: request.DropOptions,
    RequeueCount: 0,
    S3FilePath
  }

  // Create a Readable Stream from the payload to be uploaded to S3
  const S3PayloadData = new Readable()
  S3PayloadData.push(request.UsersFormatted)
  S3PayloadData.push(null)

  // Upload the file to the S3 bucket
  const S3Response = await S3ClientInstance.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: S3FilePath,
      Body: S3PayloadData,
      ContentType: 'text/plain',
      // ContentLength Issue: https://stackoverflow.com/questions/68332633/aws-s3-node-js-sdk-notimplemented-error-with-multer
      ContentLength: S3PayloadData.readableLength
    })
  )

  // Queue the file in SQS
  const SQSResponse = await SQSClientInstance.send(
    new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify(SQSPayload),
      MessageGroupId: request.CrmDataId,
      MessageDeduplicationId
    })
  )

  return {
    S3Response,
    SQSResponse
  }
}

function parseARN(awsARN: string | undefined) {
  if (awsARN === undefined) {
    throw new Error(`AWS_ROLE_ARN environment variable is possibly undefined`)
  }

  const regexParse = /arn:aws:iam[:]+(\d+):role\/[\da-z-.]+/.exec(awsARN)

  if (regexParse && regexParse[1]) {
    return regexParse[1]
  } else {
    throw new Error(`AWS_ROLE_ARN environment variable is possibly malformed`)
  }
}
