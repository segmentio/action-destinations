import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { SQSClient, SendMessageCommand, MessageAttributeValue } from '@aws-sdk/client-sqs'
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

interface IntegrationsOutboundSQSMessageAttributes {
  ActionSlug: MessageAttributeValue
  EventUUID: MessageAttributeValue
  [key: string]: MessageAttributeValue
}

interface SQSMessageBody {
  ActionSlug: string
  S3FilePath: string
  DestinationPayload: TTDEventPayload
}

const NODE_ENV = process.env['NODE_ENV'] || `stage`
const AWS_REGION = process.env['AWS_REGION'] || `us-west-2`
const AWS_ACCOUNT_ID = parseARN(process.env['AWS_ROLE_ARN']) || `1234567890`

const ACTION_SLUG = `actions-the-trade-desk-crm`

// Note: Clients are created in global scope to prevent client creation on every request
// Region and Segment Environment values are unique per Integrations Monoservice instance and will never change
const S3ClientInstance = new S3Client({ region: AWS_REGION })
const SQSClientInstance = new SQSClient({ region: AWS_REGION })

const S3_BUCKET_NAME = `integrations-outbound-event-store-${NODE_ENV}-${AWS_REGION}`
const SQS_QUEUE_NAME = `integrations-outbound-event-aggregation-queue-${NODE_ENV}-${AWS_REGION}.fifo`
const SQS_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/${SQS_QUEUE_NAME}`

export const sendEventToAWS = async (request: SendToAWSRequest) => {
  // Compute file path and message dedupe id
  // Each advertiser and segment can eventually have multiple data drops, we use uuid create unique files
  const uuidValue = uuidv4()
  const S3FilePath = `${ACTION_SLUG}/${request.AdvertiserId}-${request.CrmDataId}-${uuidValue}.txt`
  const MessageDeduplicationId = `${request.AdvertiserId}-${request.CrmDataId}-${uuidValue}`

  // Create Queue Message Payload
  const SQSPayload: SQSMessageBody = {
    ActionSlug: ACTION_SLUG,
    S3FilePath,
    DestinationPayload: {
      TDDAuthToken: request.TDDAuthToken,
      AdvertiserId: request.AdvertiserId,
      SegmentName: request.SegmentName,
      CrmDataId: request.CrmDataId,
      DropOptions: request.DropOptions,
      RequeueCount: 0
    }
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

  // Add Metadata to the SQS Message
  // This would enable us to route messages appropriate lambda functions without even parsing the message body
  const MessageAttributes: IntegrationsOutboundSQSMessageAttributes = {
    ActionSlug: {
      DataType: 'String',
      StringValue: ACTION_SLUG
    },
    EventUUID: {
      DataType: 'String',
      StringValue: uuidValue
    }
  }

  // Queue the file in SQS
  const SQSResponse = await SQSClientInstance.send(
    new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify(SQSPayload),
      MessageGroupId: request.CrmDataId,
      MessageDeduplicationId,
      MessageAttributes
    })
  )

  return {
    S3Response,
    SQSResponse
  }
}

function parseARN(awsARN: string | undefined) {
  if (awsARN === undefined) {
    // throw new Error(`AWS_ROLE_ARN environment variable is possibly undefined`)
    return ''
  }

  const regexParse = /arn:aws:iam[:]+(\d+):role\/[\da-z-.]+/.exec(awsARN)

  if (regexParse && regexParse[1]) {
    return regexParse[1]
  } else {
    // throw new Error(`AWS_ROLE_ARN environment variable is possibly malformed`)
    return ''
  }
}
