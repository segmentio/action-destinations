import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { KinesisClient, PutRecordsCommand, PutRecordsRequestEntry } from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { IntegrationError } from '@segment/actions-core'

const KINESIS_COMMAND_TIMEOUT_MS = 5000

export const validateIamRoleArnFormat = (arn: string): boolean => {
  const iamRoleArnRegex = /^arn:aws:iam::\d{12}:role\/[A-Za-z0-9+=,.@_\-/]+$/
  return iamRoleArnRegex.test(arn)
}

const validatePartitionKey = (partitionKey: string): void => {
  if (!partitionKey) {
    throw new IntegrationError(
      `Partition Key is required in the payload to send data to Kinesis.`,
      'PARTITION_KEY_MISSING',
      400
    )
  }
}

const transformPayloads = (payloads: Payload[]): PutRecordsRequestEntry[] => {
  return payloads.map((record) => ({
    Data: Buffer.from(JSON.stringify(record)),
    PartitionKey: record.partitionKey
  }))
}

const createKinesisClient = async (
  iamRoleArn: string,
  iamExternalId: string,
  awsRegion: string
): Promise<KinesisClient> => {
  const credentials = await assumeRole(iamRoleArn, iamExternalId, APP_AWS_REGION)
  return new KinesisClient({
    region: awsRegion,
    credentials: credentials,
    requestHandler: new NodeHttpHandler({
      requestTimeout: KINESIS_COMMAND_TIMEOUT_MS // timeout in milliseconds
    })
  })
}

export const send = async (
  settings: Settings,
  payloads: Payload[],
  _statsContext: StatsContext | undefined,
  logger: Logger | undefined
): Promise<void> => {
  const { iamRoleArn, iamExternalId } = settings
  const { streamName, awsRegion, partitionKey } = payloads[0]
  validatePartitionKey(partitionKey)
  const entries = transformPayloads(payloads)

  try {
    const client = await createKinesisClient(iamRoleArn, iamExternalId, awsRegion)
    const command = new PutRecordsCommand({
      StreamName: streamName,
      Records: entries
    })

    await client.send(command)
  } catch (error) {
    logger?.crit('Failed to send batch to Kinesis:', error)
    throw error
  }

  // Todo
  // 1. Handle Errors and Partial Failures from Kinesis
  // 2. Add logs and metrics
  // 5. Multi status response
}
