import { RequestOptions } from '@segment/actions-core'
import { S3Client, PutObjectCommand, PutObjectRequest } from '@aws-sdk/client-s3'
import { SQSClient, SendMessageCommand, SendMessageRequest } from '@aws-sdk/client-sqs'
import { v4 as uuidv4 } from '@lukeed/uuid'
import { Readable } from 'stream'

import { createHash } from 'node:crypto'

interface AWSResourcesItem {
  S3_BUCKET_NAME: string
  SQS_QUEUE_NAME: string
  SQS_QUEUE_URL: string
}

interface ControlledBatchOutboundEventPayload {
  audienceId: string
  request: {
    url: string
    requestOptions: RequestOptions
  }
}

const NODE_ENV = process.env['NODE_ENV'] || `stage`
const AWS_REGION = process.env['AWS_REGION'] || `us-west-2`

const ACTION_SLUG = `actions-the-trade-desk-crm`
const INTEGRATIONS_ENV_KEY = `${NODE_ENV}.${AWS_REGION}`

const AWS_RESOURCES: Record<string, AWSResourcesItem> = {
  'stage.us-west-2': {
    S3_BUCKET_NAME: 'integrations-outbound-event-store-stage-us-west-2',
    SQS_QUEUE_NAME: 'integrations-outbound-event-queue-stage-us-west-2.fifo',
    SQS_QUEUE_URL:
      'https://sqs.us-west-2.amazonaws.com/355207333203/integrations-outbound-event-queue-stage-us-west-2.fifo'
  },
  'test.us-west-2': {
    S3_BUCKET_NAME: 'test-bucket',
    SQS_QUEUE_NAME: 'test-queue.fifo',
    SQS_QUEUE_URL:
      'https://sqs.us-west-2.amazonaws.com/355207333203/integrations-outbound-event-queue-stage-us-west-2.fifo'
  }
}

// Note: Clients are created in global scope to prevent client creation on every request
// Region and Segment Environment values are unique per Integrations Monoservice instance and will never change
const S3ClientInstance = new S3Client({ region: AWS_REGION })
const SQSClientInstance = new SQSClient({ region: AWS_REGION, logger: console })

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

  console.log('S3Payload', createHash('md5').update(JSON.stringify(S3Payload)).digest('hex'))

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
    Bucket: AWS_RESOURCES[INTEGRATIONS_ENV_KEY].S3_BUCKET_NAME,
    Key: s3FilePath,
    Body: S3PayloadData,
    ContentType: 'application/json',
    ContentEncoding: 'gzip'
  }

  // Construct Send Message request for SQS
  const SQSSendMessageRequest: SendMessageRequest = {
    QueueUrl: AWS_RESOURCES[INTEGRATIONS_ENV_KEY].SQS_QUEUE_URL,
    MessageBody: JSON.stringify(SQSPayload),
    MessageDeduplicationId: messageDedupeId,
    MessageGroupId: audienceId
  }

  // Upload the file to the S3 bucket
  await S3ClientInstance.send(new PutObjectCommand(S3PutObjectRequest))

  // Queue the file in SQS
  await SQSClientInstance.send(new SendMessageCommand(SQSSendMessageRequest))
}
