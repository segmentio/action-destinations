import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { PayloadValidationError, MultiStatusResponse, RetryableError, IntegrationError } from '@segment/actions-core'
import { SEGMENT_PARTNER_NAME, EBRetryableErrors, EBNotRetryableErrors } from './constants'
import { PutPartnerEventsResultEntry, EventBridgeClient, PutPartnerEventsCommand, PutPartnerEventsCommandOutput } from '@aws-sdk/client-eventbridge'
import { PutPartnerEventsCommandJSON, HookOutputs } from './types'

export async function send(payloads: Payload[], settings: Settings, hookOutputs?: HookOutputs): Promise<MultiStatusResponse> {

  const sourceId = getSourceId(payloads, hookOutputs)

  const { region } = settings

  const client = new EventBridgeClient({ region })

  const commandJSON = createCommandJSON(payloads, sourceId)

  const command = new PutPartnerEventsCommand(commandJSON)

  let response: PutPartnerEventsCommandOutput 

  try {
    response = await client.send(command)
  } catch (error) {
     throwError(error, `client.send`)
  }

  return buildMultiStatusResponse(response, payloads)  
}

function getSourceId(payloads: Payload[], hookOutputs?: HookOutputs): string {
  const payloadSourceId = payloads[0].sourceId
  const hookSourceId = hookOutputs?.onMappingSave?.sourceId ?? hookOutputs?.retlOnMappingSave?.sourceId

  if (!payloadSourceId) {
    throw new PayloadValidationError('Source ID is required. Source ID not found in payload. It should be present at $.context.protocols.sourceId or $.projectId in the payload.')
  }

  if (!hookSourceId) {
    throw new PayloadValidationError('Source ID is required. Source ID not found in hook outputs.')
  }

  if(hookSourceId !== payloadSourceId) {
    throw new PayloadValidationError('Mismatch between payload and hook source ID values.')
  }

  return payloadSourceId
}

function buildMultiStatusResponse(response: PutPartnerEventsCommandOutput, payloads: Payload[]): MultiStatusResponse {
  const entries: PutPartnerEventsResultEntry[] = response.Entries ?? []
  const multiStatusResponse = new MultiStatusResponse()
  payloads.forEach((event, index) => {
    const entry = entries[index]
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
      EventBusName: sourceId,
      Source: `${SEGMENT_PARTNER_NAME}/${sourceId}`,
      DetailType: event.detailType,
      Detail: JSON.stringify(event.data),
      Resources: Array.isArray(event.resources) ? event.resources : typeof event.resources === 'string' ? [event.resources] : [],
      Time: event.time ? new Date(event.time): new Date()
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
  if(isRetryableError(error)) {
    const err = error as { name: string; message?: string }
    const message = err.message ?? 'No error message returned'
    throw new RetryableError(`Retryable error ${err.name} in ${context}. Message: ${message}`);
  } else if(isNotRetryableError(error)) {
    const err = error as { name: string; message?: string }
    const message = err.message ?? 'No error message returned'
    throw new IntegrationError(`Non-retryable error ${err.name} in ${context}. Message: ${message}`, err.name, 400)
  } else {
    throw new IntegrationError(`Unknown error in ${context}: ${JSON.stringify(error)}`, 'UnknownError', 500)
  }
}