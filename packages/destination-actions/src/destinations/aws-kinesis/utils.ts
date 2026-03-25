import type { Payload } from './send/generated-types'
import type { Settings } from './generated-types'
import { PayloadValidationError, MultiStatusResponse, RetryableError, IntegrationError } from '@segment/actions-core'
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis'
import type { PutRecordsCommandOutput, PutRecordsResultEntry } from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'

const KinesisRetryableErrors: Record<string, string> = {
  ProvisionedThroughputExceededException: 'RETRYABLE',
  InternalFailure: 'RETRYABLE',
  KMSThrottlingException: 'RETRYABLE',
  ServiceUnavailableException: 'RETRYABLE',
  ThrottlingException: 'RETRYABLE'
}

const KinesisNotRetryableErrors: Record<string, string> = {
  AccessDeniedException: 'NON_RETRYABLE',
  InvalidArgumentException: 'NON_RETRYABLE',
  KMSAccessDeniedException: 'NON_RETRYABLE',
  KMSDisabledException: 'NON_RETRYABLE',
  KMSInvalidStateException: 'NON_RETRYABLE',
  KMSNotFoundException: 'NON_RETRYABLE',
  KMSOptInRequired: 'NON_RETRYABLE',
  ResourceNotFoundException: 'NON_RETRYABLE',
  ValidationException: 'NON_RETRYABLE'
}

export async function createKinesisClient(settings: Settings, region: string): Promise<KinesisClient> {
  const credentials = await assumeRole(settings.iam_role_arn, settings.iam_external_id, APP_AWS_REGION)
  return new KinesisClient({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    }
  })
}

export function buildRecords(payloads: Payload[]): Array<{ Data: Uint8Array; PartitionKey: string }> {
  return payloads.map((p) => {
    if (!p.partitionKey) {
      throw new PayloadValidationError('partitionKey is required but was not provided')
    }
    return {
      Data: new TextEncoder().encode(JSON.stringify(p.payload)),
      PartitionKey: p.partitionKey
    }
  })
}

export async function sendToKinesis(payloads: Payload[], settings: Settings): Promise<MultiStatusResponse> {
  if (payloads.length === 0) {
    return new MultiStatusResponse()
  }

  const firstPayload = payloads[0]
  const client = await createKinesisClient(settings, firstPayload.region)
  const records = buildRecords(payloads)

  const command = new PutRecordsCommand({
    StreamName: firstPayload.streamName,
    Records: records
  })

  let response: PutRecordsCommandOutput

  try {
    response = await client.send(command)
  } catch (error) {
    throwError(error, 'client.send')
  }

  return buildMultiStatusResponse(response, payloads)
}

function buildMultiStatusResponse(response: PutRecordsCommandOutput, payloads: Payload[]): MultiStatusResponse {
  const records: PutRecordsResultEntry[] = response.Records ?? []
  const multiStatusResponse = new MultiStatusResponse()

  payloads.forEach((event, index) => {
    const record = records[index] ?? {}
    if (record.ErrorCode || record.ErrorMessage) {
      const isRetryable = record.ErrorCode ? record.ErrorCode in KinesisRetryableErrors : false
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: isRetryable ? 429 : 400,
        errortype: isRetryable ? 'RETRYABLE_ERROR' : 'PAYLOAD_VALIDATION_FAILED',
        errormessage: record.ErrorMessage ?? record.ErrorCode ?? 'Unknown Error',
        sent: JSON.stringify(event),
        body: JSON.stringify(record)
      })
    } else {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        body: JSON.stringify({ ShardId: record.ShardId, SequenceNumber: record.SequenceNumber }),
        sent: JSON.stringify(event)
      })
    }
  })

  return multiStatusResponse
}

function isRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return err.name in KinesisRetryableErrors
  }
  return false
}

function isNotRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return err.name in KinesisNotRetryableErrors
  }
  return false
}

function throwError(error: unknown, context: string): never {
  if (isRetryableError(error)) {
    const err = error as { name: string; message?: string }
    const message = err.message ?? 'No error message returned'
    throw new RetryableError(`Retryable error ${err.name} in ${context}. Message: ${message}`)
  } else if (isNotRetryableError(error)) {
    const err = error as { name: string; message?: string }
    const message = err.message ?? 'No error message returned'
    throw new IntegrationError(`Non-retryable error ${err.name} in ${context}. Message: ${message}`, err.name, 400)
  } else {
    throw new IntegrationError(`Unknown error in ${context}: ${JSON.stringify(error)}`, 'UnknownError', 400)
  }
}
