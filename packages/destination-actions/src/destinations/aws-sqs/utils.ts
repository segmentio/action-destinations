import type { Payload } from './send/generated-types'
import type { Settings } from './generated-types'
import { MultiStatusResponse, RetryableError, IntegrationError, RequestTimeoutError } from '@segment/actions-core'
import type { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs'
import type {
  SendMessageBatchCommandOutput,
  BatchResultErrorEntry,
  SendMessageBatchResultEntry
} from '@aws-sdk/client-sqs'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'

const SQSRetryableErrors: Record<string, string> = {
  RequestThrottled: 'RETRYABLE',
  KmsThrottled: 'RETRYABLE'
}

const SQSNonRetryableErrors: Record<string, number> = {
  QueueDoesNotExist: 404,
  InvalidAddress: 400,
  InvalidSecurity: 403,
  BatchEntryIdsNotDistinct: 400,
  BatchRequestTooLong: 400,
  EmptyBatchRequest: 400,
  InvalidBatchEntryId: 400,
  TooManyEntriesInBatchRequest: 400,
  UnsupportedOperation: 400,
  KmsAccessDenied: 403,
  KmsDisabled: 503,
  KmsInvalidState: 400,
  KmsInvalidKeyUsage: 400,
  KmsNotFound: 404,
  KmsOptInRequired: 403
}

export async function send(
  payloads: Payload[],
  settings: Settings,
  statsContext?: StatsContext,
  logger?: Logger,
  signal?: AbortSignal
): Promise<MultiStatusResponse> {
  const { awsRegion } = payloads[0]
  console.log(
    '[SQS] Starting send. Region:',
    awsRegion,
    'Queue:',
    payloads[0].queueUrl,
    'Payload count:',
    payloads.length
  )

  console.log('[SQS] Assuming role:', settings.iamRoleArn)
  const credentials = await assumeRole(settings.iamRoleArn, settings.iamExternalId, APP_AWS_REGION)
  console.log('[SQS] Role assumed successfully')

  const client = new SQSClient({
    region: awsRegion,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    }
  })

  const command = new SendMessageBatchCommand({
    QueueUrl: payloads[0].queueUrl,
    Entries: payloads.map((p, index) => ({
      Id: String(index),
      MessageBody: JSON.stringify(p.payload),
      MessageGroupId: p.messageGroupId || undefined,
      MessageDeduplicationId: p.messageDeduplicationId || undefined,
      DelaySeconds: p.delaySeconds || undefined
    }))
  })

  statsContext?.statsClient?.histogram('actions_sqs.batch_size', payloads.length, statsContext?.tags)
  statsContext?.statsClient?.incr('actions_sqs.request_hit', 1, statsContext?.tags)

  let response: SendMessageBatchCommandOutput

  try {
    response = await client.send(command, { abortSignal: signal })
    console.log(
      '[SQS] Send successful. Successful:',
      response.Successful?.length ?? 0,
      'Failed:',
      response.Failed?.length ?? 0
    )
    if (response.Failed?.length) {
      console.log('[SQS] Failed entries:', JSON.stringify(response.Failed))
    }
  } catch (error) {
    console.log('[SQS] Send failed:', (error as Error).name, (error as Error).message)
    if ((error as Error).name === 'AbortError') {
      throw new RequestTimeoutError()
    }
    if (logger && typeof logger.crit === 'function') {
      logger.crit('Failed to send batch to SQS:', error)
    }
    throwError(error, 'client.send')
  }

  return buildMultiStatusResponse(response, payloads)
}

function buildMultiStatusResponse(response: SendMessageBatchCommandOutput, payloads: Payload[]): MultiStatusResponse {
  const successful: SendMessageBatchResultEntry[] = response.Successful ?? []
  const failed: BatchResultErrorEntry[] = response.Failed ?? []
  const multiStatusResponse = new MultiStatusResponse()

  for (const entry of successful) {
    const index = Number(entry.Id)
    multiStatusResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      body: JSON.stringify(entry),
      sent: JSON.stringify(payloads[index])
    })
  }

  for (const entry of failed) {
    const index = Number(entry.Id)
    const status = entry.SenderFault ? 400 : 429
    multiStatusResponse.setErrorResponseAtIndex(index, {
      status,
      errormessage: entry.Message ?? 'Unknown Error',
      sent: JSON.stringify(payloads[index]),
      body: JSON.stringify(entry)
    })
  }

  return multiStatusResponse
}

function isRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return err.name in SQSRetryableErrors
  }
  return false
}

function isNonRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return err.name in SQSNonRetryableErrors
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
    const status = SQSNonRetryableErrors[err.name] ?? 400
    throw new IntegrationError(`Non-retryable error ${err.name} in ${context}. Message: ${message}`, err.name, status)
  } else {
    throw new IntegrationError(`Unknown error in ${context}: ${JSON.stringify(error)}`, 'UnknownError', 400)
  }
}
