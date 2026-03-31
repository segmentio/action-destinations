import type { Payload } from './send/generated-types'
import type { Settings } from './generated-types'
import { MultiStatusResponse, RetryableError, IntegrationError, RequestTimeoutError } from '@segment/actions-core'
import type { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis'
import type { PutRecordsCommandOutput, PutRecordsResultEntry } from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'

const KinesisRetryableErrors: Record<string, string> = {
  ProvisionedThroughputExceededException: 'RETRYABLE',
  InternalFailure: 'RETRYABLE',
  ThrottlingException: 'RETRYABLE',
  ServiceUnavailable: 'RETRYABLE',
  KMSThrottlingException: 'RETRYABLE'
}

const KinesisNonRetryableErrors: Record<string, string> = {
  ResourceNotFoundException: 'NON_RETRYABLE',
  InvalidArgumentException: 'NON_RETRYABLE',
  AccessDeniedException: 'NON_RETRYABLE',
  KMSDisabledException: 'NON_RETRYABLE',
  KMSInvalidStateException: 'NON_RETRYABLE',
  KMSAccessDeniedException: 'NON_RETRYABLE',
  KMSNotFoundException: 'NON_RETRYABLE',
  KMSOptInRequired: 'NON_RETRYABLE',
  ValidationException: 'NON_RETRYABLE'
}

export async function send(
  payloads: Payload[],
  settings: Settings,
  statsContext?: StatsContext,
  logger?: Logger,
  signal?: AbortSignal
): Promise<MultiStatusResponse> {
  const { awsRegion } = payloads[0]
  const credentials = await assumeRole(settings.iamRoleArn, settings.iamExternalId, APP_AWS_REGION)

  const client = new KinesisClient({
    region: awsRegion,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    }
  })

  const command = new PutRecordsCommand({
    StreamName: payloads[0].streamName,
    Records: payloads.map((p) => ({
      Data: Buffer.from(JSON.stringify(p.payload)),
      PartitionKey: p.partitionKey
    }))
  })

  statsContext?.statsClient?.histogram('actions_kinesis.batch_size', payloads.length, statsContext?.tags)
  statsContext?.statsClient?.incr('actions_kinesis.request_hit', 1, statsContext?.tags)

  let response: PutRecordsCommandOutput

  try {
    response = await client.send(command, { abortSignal: signal })
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new RequestTimeoutError()
    }
    if (logger && typeof logger.crit === 'function') {
      logger.crit('Failed to send batch to Kinesis:', error)
    }
    throwError(error, 'client.send')
  }

  return buildMultiStatusResponse(response, payloads)
}

function buildMultiStatusResponse(response: PutRecordsCommandOutput, payloads: Payload[]): MultiStatusResponse {
  const entries: PutRecordsResultEntry[] = response.Records ?? []
  const multiStatusResponse = new MultiStatusResponse()

  payloads.forEach((event, index) => {
    const entry = entries[index] ?? {}
    if (entry.ErrorCode || entry.ErrorMessage) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage: entry.ErrorMessage ?? 'Unknown Error',
        sent: JSON.stringify(event),
        body: JSON.stringify(entry)
      })
    } else {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        body: 'Record sent successfully',
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

function isNonRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return err.name in KinesisNonRetryableErrors
  }
  return false
}

function throwError(error: unknown, context: string): never {
  if (isRetryableError(error)) {
    const err = error as { name: string; message?: string }
    const message = err.message ?? 'No error message returned'
    throw new RetryableError(`Retryable error ${err.name} in ${context}. Message: ${message}`)
  } else if (isNonRetryableError(error)) {
    const err = error as { name: string; message?: string }
    const message = err.message ?? 'No error message returned'
    throw new IntegrationError(`Non-retryable error ${err.name} in ${context}. Message: ${message}`, err.name, 400)
  } else {
    throw new IntegrationError(`Unknown error in ${context}: ${JSON.stringify(error)}`, 'UnknownError', 400)
  }
}
