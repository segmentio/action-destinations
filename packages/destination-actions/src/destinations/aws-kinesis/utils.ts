import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { KinesisClient, PutRecordsCommand, PutRecordsCommandOutput, PutRecordsRequestEntry } from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '@segment/actions-shared'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { IntegrationError, MultiStatusResponse, JSONLikeObject } from '@segment/actions-core'

const KINESIS_COMMAND_TIMEOUT_MS = 5000

export const validateIamRoleArnFormat = (arn: string): boolean => {
  const iamRoleArnRegex = /^arn:aws:iam::\d{12}:role\/[A-Za-z0-9+=,.@_\-/]+$/
  return iamRoleArnRegex.test(arn)
}

const validatePartitionKey = (partitionKey: string, statsContext: StatsContext | undefined): void => {
  if (!partitionKey) {
    statsContext?.statsClient?.incr('actions_kinesis.missing_partition_key', 1, statsContext?.tags)
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

const handleError = (error: any, statsContext: StatsContext | undefined): void => {
  if (error?.name === 'AccessDeniedException') {
    statsContext?.statsClient?.incr('actions_kinesis.access_denied_exception', 1, statsContext?.tags)
    throw new IntegrationError(
      `Access denied. Please check that the provided IAM Role has the necessary permissions to access Kinesis.`,
      'ACCESS_DENIED',
      400
    )
  }

  statsContext?.statsClient?.incr('actions_kinesis.error', 1, statsContext?.tags)
  throw new IntegrationError(
    `Failed to send batch to Kinesis: ${error?.message}`,
    'DEPENDENCY_ERROR',
    500
  )
}

const handleMultiStatusResponse = (
  response: PutRecordsCommandOutput,
  statsContext: StatsContext | undefined,
  payloads: Payload[]
): MultiStatusResponse => {
  const multiStatusResponse: MultiStatusResponse = new MultiStatusResponse()
  const { FailedRecordCount, Records } = response
  if (!FailedRecordCount || FailedRecordCount == 0) {
    statsContext?.statsClient?.incr('actions_kinesis.successful_record_count', Records?.length || 0, statsContext?.tags)
    // All records succeeded
    Records?.forEach((record: any, index: number) => {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        body: record,
        sent: payloads[index] as unknown as JSONLikeObject
      })
    })
  }

  if (FailedRecordCount && FailedRecordCount > 0) {
    statsContext?.statsClient?.incr('actions_kinesis.failed_record_count', FailedRecordCount, statsContext?.tags)
    // Add metrics for each error type
    Records?.forEach((record: any, index: number) => {
      if (record.ErrorCode) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: record.ErrorCode,
          errormessage: record.ErrorMessage
        })
      }
    })
  } else {
    
  }

  return multiStatusResponse
}

export const send = async (
  settings: Settings,
  payloads: Payload[],
  statsContext: StatsContext | undefined,
  logger: Logger | undefined
): Promise<MultiStatusResponse> => {
  const { iamRoleArn, iamExternalId } = settings
  const { streamName, awsRegion, partitionKey } = payloads[0]
  validatePartitionKey(partitionKey, statsContext)
  const entries = transformPayloads(payloads)

  statsContext?.statsClient?.histogram('actions_kinesis.batch_size', entries?.length, statsContext?.tags)
  statsContext?.statsClient?.incr('actions_kinesis.request_hit', 1, statsContext?.tags)

  try {
    const client = await createKinesisClient(iamRoleArn, iamExternalId, awsRegion)
    const command = new PutRecordsCommand({
      StreamName: streamName,
      Records: entries
    })
    const response = await client.send(command)
    return handleMultiStatusResponse(response, statsContext)
  } catch (error) {
    logger?.crit('Failed to send batch to Kinesis:', error)
    handleError(error, statsContext)
    throw error
  }

}
