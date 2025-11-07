import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'

const MAX_RECORDS_PER_BATCH = 1000

export const validateIamRoleArnFormat = (arn: string): boolean => {
  const iamRoleArnRegex = /^arn:aws:iam::\d{12}:role\/[A-Za-z0-9+=,.@_\-/]+$/
  return iamRoleArnRegex.test(arn)
}

export const sendDataToKinesis = async (
  settings: Settings,
  payloads: Payload[],
  _statsContext: StatsContext | undefined,
  logger: Logger | undefined
): Promise<void> => {
  // transform and send
  if (!Array.isArray(payloads) || payloads.length === 0) {
    throw new Error('payloads must be a non-empty array')
  }

  const streamToAwsRegion: Map<string, string> = new Map<string, string>()
  const streamToPayloads = new Map<string, Payload[][]>() // array of batches
  populatePayload(payloads, streamToAwsRegion, streamToPayloads)
  const { iamRoleArn, iamExternalId } = settings
  await sendToKinesis(iamRoleArn, iamExternalId, streamToAwsRegion, streamToPayloads, logger)

  // Todo
  // 1. Handle Errors and Partial Failures from Kinesis
  // 2. Add logs
  // 3. Add metrics
  // 4. Handle case when partitionKey is missing or empty
  // 5. Multi status response
}

export const populatePayload = (
  payloads: Payload[],
  streamToAwsRegion: Map<string, string>,
  streamToPayloads = new Map<string, Payload[][]>()
): void => {
  payloads.forEach((payload) => {
    const { streamName, awsRegion } = payload

    if (!streamToAwsRegion.get(streamName)) {
      streamToAwsRegion.set(streamName, awsRegion)
      streamToPayloads.set(streamName, [[]]) // start with one empty batch
    }

    const batches = streamToPayloads.get(streamName)!
    let currentBatch = batches[batches.length - 1]

    if (currentBatch.length >= MAX_RECORDS_PER_BATCH) {
      // start a new batch if the current one is full
      currentBatch = []
      batches.push(currentBatch)
    }

    currentBatch.push(payload)
  })
}

export const sendToKinesis = async (
  iamRoleArn: string,
  iamExternalId: string,
  streamToAwsRegion: Map<string, string>,
  streamToPayloads: Map<string, Payload[][]>,
  logger: Logger | undefined
): Promise<void> => {
  const credentials = await assumeRole(iamRoleArn, iamExternalId, APP_AWS_REGION)
  for (const [streamName, batches] of streamToPayloads.entries()) {
    const awsRegion = streamToAwsRegion.get(streamName)!
    for (const batch of batches) {
      await sendBatchToKinesis(logger, streamName, awsRegion, credentials, batch)
    }
  }
}

export const sendBatchToKinesis = async (
  logger: Logger | undefined,
  streamName: string,
  awsRegion: string,
  credentials: any,
  batch: Payload[]
): Promise<void> => {
  const entries = batch.map((record) => ({
    Data: Buffer.from(typeof record === 'string' ? record : JSON.stringify(record)),
    PartitionKey: record.partitionKey
  }))

  try {
    const command = new PutRecordsCommand({
      StreamName: streamName,
      Records: entries
    })

    const client = new KinesisClient({
      region: awsRegion,
      credentials: credentials
    })

    await client.send(command)
  } catch (error) {
    logger?.crit('Failed to send batch to Kinesis:', error)
    throw error
  }
}
