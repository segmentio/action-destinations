import { RequestOptions } from '@segment/actions-core'
import { S3Client, PutObjectCommand, PutObjectRequest } from '@aws-sdk/client-s3'
import { SQSClient, SendMessageCommand, SendMessageRequest } from '@aws-sdk/client-sqs'
import { v4 as uuidv4 } from '@lukeed/uuid'
import { Readable } from 'stream'

interface ControlledBatchOutboundEventPayload {
  audienceId: string
  request: {
    url: string
    requestOptions: RequestOptions
  }
}

const NODE_ENV = process.env['NODE_ENV'] || `stage`
const AWS_REGION = process.env['AWS_REGION'] || `us-west-2`
const AWS_ACCOUNT_ID = parseARN(process.env['AWS_ROLE_ARN'])

const ACTION_SLUG = `actions-the-trade-desk-crm`

// Note: Clients are created in global scope to prevent client creation on every request
// Region and Segment Environment values are unique per Integrations Monoservice instance and will never change
const S3ClientInstance = new S3Client({ region: AWS_REGION })
const SQSClientInstance = new SQSClient({ region: AWS_REGION, logger: console })

const S3_BUCKET_NAME = `integrations-outbound-event-store-${NODE_ENV}-${AWS_REGION}`
const SQS_QUEUE_NAME = `integrations-outbound-event-queue-${NODE_ENV}-${AWS_REGION}.fifo`
const SQS_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/3${AWS_ACCOUNT_ID}/${SQS_QUEUE_NAME}`

export const sendEventToAWS = async (endpoint: string, users: string, audienceId: string) => {
  // Compute file path and message dedupe id
  const uuidValue = uuidv4()
  const s3FilePath = `${ACTION_SLUG}/outbound/${audienceId}-${uuidValue}.json`
  const messageDedupeId = `${audienceId}-${uuidValue}`

  // Create Batch Request Payload
  const S3Payload: ControlledBatchOutboundEventPayload = {
    audienceId,
    request: {
      url: endpoint,
      requestOptions: {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: users
      }
    }
  }

  // Create Queue Message Payload
  const SQSPayload = {
    audienceId,
    s3FilePath
  }

  // Create a Readable Stream from the payload to be uploaded to S3
  const S3PayloadData = new Readable()
  S3PayloadData.push(JSON.stringify(S3Payload))
  S3PayloadData.push(null)

  // Construct a PUT request for S3
  const S3PutObjectRequest: PutObjectRequest = {
    Bucket: S3_BUCKET_NAME,
    Key: s3FilePath,
    Body: S3PayloadData,
    ContentType: 'application/json',
    // ContentLength Issue: https://stackoverflow.com/questions/68332633/aws-s3-node-js-sdk-notimplemented-error-with-multer
    ContentLength: S3PayloadData.readableLength
  }

  // Construct Send Message request for SQS
  const SQSSendMessageRequest: SendMessageRequest = {
    QueueUrl: SQS_QUEUE_URL,
    MessageBody: JSON.stringify(SQSPayload),
    MessageDeduplicationId: messageDedupeId,
    MessageGroupId: audienceId
  }

  // Upload the file to the S3 bucket
  const S3Response = await S3ClientInstance.send(new PutObjectCommand(S3PutObjectRequest))

  // Queue the file in SQS
  const SQSResponse = await SQSClientInstance.send(new SendMessageCommand(SQSSendMessageRequest))

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
