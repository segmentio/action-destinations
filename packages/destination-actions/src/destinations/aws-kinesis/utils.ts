import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'

export const validateIamRoleArnFormat = (arn: string): boolean => {
  const iamRoleArnRegex = /^arn:aws:iam::\d{12}:role\/[A-Za-z0-9+=,.@_\-/]+$/
  return iamRoleArnRegex.test(arn)
}

export const sendDataToKinesis = async (
  settings: Settings,
  payloads: Payload[],
  _statsContext: StatsContext | undefined,
  _logger: Logger | undefined
): Promise<void> => {
  // transform and send
  if (!Array.isArray(payloads) || payloads.length === 0) {
    throw new Error('records must be a non-empty array')
  }

  const { iamRoleArn, iamExternalId } = settings

  const credentials = await assumeRole(iamRoleArn, iamExternalId, APP_AWS_REGION)
  console.log(credentials)
  const { streamName, awsRegion } = payloads[0]
  const client = new KinesisClient({
    region: awsRegion,
    credentials: credentials
  })
  const entries = payloads.map((record) => ({
    Data: Buffer.from(typeof record === 'string' ? record : JSON.stringify(record)),
    PartitionKey: record.partitionKey
  }))

  try {
    const command = new PutRecordsCommand({
      StreamName: streamName,
      Records: entries
    })

    const response = await client.send(command)
    console.log(`✅ Sent ${payloads.length} records to Kinesis`)
    console.log('Response:', response)
  } catch (error) {
    console.error('Failed to send batch to Kinesis:', error)
    throw error
  }
}
