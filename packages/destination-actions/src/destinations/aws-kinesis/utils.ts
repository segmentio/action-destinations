import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { KinesisClient, PutRecordsCommand, PutRecordsRequestEntry } from '@aws-sdk/client-kinesis'
import { APP_AWS_REGION } from '@segment/actions-shared'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { IntegrationError, ErrorCodes } from '@segment/actions-core'
import { v4 as uuidv4 } from '@lukeed/uuid'

export type AWSCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

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

    const response = await client.send(command)
    console.log('mzkh 7', response)
  } catch (error) {
    logger?.crit('Failed to send batch to Kinesis:', error)
    throw error
  }

  // Todo
  // 1. Handle Errors and Partial Failures from Kinesis
  // 2. Add logs and metrics
  // 5. Multi status response
}

export const assumeRole = async (roleArn: string, externalId: string, region: string): Promise<AWSCredentials> => {
  const intermediaryARN = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS as string
  const intermediaryExternalId = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID as string
  if (!intermediaryARN || !intermediaryExternalId) {
    throw new IntegrationError(
      'Intermediary role ARN or external ID is not set in environment variables',
      ErrorCodes.INVALID_AUTHENTICATION,
      500
    )
  }

  const intermediaryCreds = await getSTSCredentials(intermediaryARN, intermediaryExternalId, region)
  return getSTSCredentials(roleArn, externalId, region, intermediaryCreds)
}

const getSTSCredentials = async (roleId: string, externalId: string, region: string, credentials?: AWSCredentials) => {
  const options = { credentials, region: region }
  const stsClient = new STSClient(options)
  const roleSessionName: string = uuidv4()
  const command = new AssumeRoleCommand({
    RoleArn: roleId,
    RoleSessionName: roleSessionName,
    ExternalId: externalId
  })
  const result = await stsClient.send(command)
  if (
    !result.Credentials ||
    !result.Credentials.AccessKeyId ||
    !result.Credentials.SecretAccessKey ||
    !result.Credentials.SessionToken
  ) {
    throw new IntegrationError('Failed to assume role', ErrorCodes.INVALID_AUTHENTICATION, 403)
  }

  return {
    accessKeyId: result.Credentials.AccessKeyId,
    secretAccessKey: result.Credentials.SecretAccessKey,
    sessionToken: result.Credentials.SessionToken
  }
}
