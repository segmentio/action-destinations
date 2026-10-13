import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  PayloadValidationError,
  MultiStatusResponse,
  RetryableError,
  IntegrationError,
  Features
} from '@segment/actions-core'
import {
  SEGMENT_PARTNER_NAME,
  EBRetryableErrors,
  EBNotRetryableErrors,
  FLAGON_NAME_RETRY_CLASSIFICATION_FIX
} from './constants'
import {
  PutPartnerEventsResultEntry,
  EventBridgeClient,
  PutPartnerEventsCommand,
  PutPartnerEventsCommandOutput
} from '@aws-sdk/client-eventbridge'
import { PutPartnerEventsCommandJSON, HookOutputs } from './types'

export async function send(
  payloads: Payload[],
  settings: Settings,
  hookOutputs?: HookOutputs,
  features?: Features,
  isBatch = true
): Promise<MultiStatusResponse> {
  const sourceId = getSourceId(hookOutputs)

  const { region } = settings

  const client = getClient(region)

  const classificationFix = Boolean(features?.[FLAGON_NAME_RETRY_CLASSIFICATION_FIX])

  const commandJSON = createCommandJSON(payloads, sourceId)

  const command = new PutPartnerEventsCommand(commandJSON)

  let response: PutPartnerEventsCommandOutput

  try {
    response = await client.send(command)
  } catch (error) {
    if (classificationFix) {
      throwClassifiedError(error, `client.send`)
    }
    throwError(error, `client.send`)
  }

  if (classificationFix && !isBatch) {
    throwIfEntryFailed(response.Entries?.[0])
  }

  return buildMultiStatusResponse(response, payloads, classificationFix)
}

const clients = new Map<string, EventBridgeClient>()

function getClient(region: string): EventBridgeClient {
  let client = clients.get(region)
  if (!client) {
    client = new EventBridgeClient({ region })
    clients.set(region, client)
  }
  return client
}

function getSourceId(hookOutputs?: HookOutputs): string {
  const hookSourceId = hookOutputs?.onMappingSave?.outputs?.sourceId ?? hookOutputs?.retlOnMappingSave?.outputs?.sourceId

  if (!hookSourceId) {
    throw new PayloadValidationError("Partner Event Source ID not found. Create a Partner Event Source using the 'Create Partner Source' button in the Action Mapping, then try again.")
  }

  return hookSourceId
}

function buildMultiStatusResponse(
  response: PutPartnerEventsCommandOutput,
  payloads: Payload[],
  classificationFix: boolean
): MultiStatusResponse {
  const entries: PutPartnerEventsResultEntry[] = response.Entries ?? []
  const multiStatusResponse = new MultiStatusResponse()
  payloads.forEach((event, index) => {
    const entry = entries[index] ?? {}
    if (entry.ErrorCode || entry.ErrorMessage) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: classificationFix ? getEntryErrorStatus(entry.ErrorCode) : 400,
        errormessage: entry.ErrorMessage ?? 'Unknown Error',
        sent: JSON.stringify(event),
        body: JSON.stringify(entry)
      })
    } else {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        body: 'Event sent successfully',
        sent: JSON.stringify(event)
      })
    }
  })

  return multiStatusResponse
}

function createCommandJSON(payloads: Payload[], sourceId: string): PutPartnerEventsCommandJSON {
  return {
    Entries: payloads.map((event) => ({
      Source: `${SEGMENT_PARTNER_NAME}/${sourceId}`,
      DetailType: event.detailType,
      Detail: JSON.stringify(event.data),
      Resources: Array.isArray(event.resources)
        ? event.resources
        : typeof event.resources === 'string'
        ? [event.resources]
        : [],
      Time: event.time ? new Date(event.time) : new Date()
    }))
  }
}

function isRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return !(err.name in EBRetryableErrors)
  }
  return true
}

function isNotRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return !(err.name in EBNotRetryableErrors)
  }
  return true
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

function getErrorName(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const { name } = error as { name: unknown }
    return typeof name === 'string' ? name : undefined
  }
  return undefined
}

function getEntryErrorStatus(errorCode?: string): number {
  if (errorCode === 'ThrottlingException') {
    return 429
  }
  if (errorCode && errorCode in EBRetryableErrors) {
    return 500
  }
  return 400
}

function throwClassifiedError(error: unknown, context: string): never {
  const name = getErrorName(error) ?? 'UnknownError'
  const message = (error as { message?: string } | null)?.message ?? 'No error message returned'

  if (name === 'ThrottlingException') {
    throw new RetryableError(`Retryable error ${name} in ${context}. Message: ${message}`, 429)
  }
  if (name in EBNotRetryableErrors) {
    throw new IntegrationError(`Non-retryable error ${name} in ${context}. Message: ${message}`, name, 400)
  }
  throw new RetryableError(`Retryable error ${name} in ${context}. Message: ${message}`)
}

function throwIfEntryFailed(entry?: PutPartnerEventsResultEntry): void {
  if (!entry?.ErrorCode && !entry?.ErrorMessage) {
    return
  }
  const code = entry.ErrorCode ?? 'UnknownError'
  const message = `Entry failed with ${code}. Message: ${entry.ErrorMessage ?? 'Unknown Error'}`
  const status = getEntryErrorStatus(entry.ErrorCode)
  if (status === 429 || status === 500) {
    throw new RetryableError(message, status)
  }
  throw new IntegrationError(message, code, 400)
}
