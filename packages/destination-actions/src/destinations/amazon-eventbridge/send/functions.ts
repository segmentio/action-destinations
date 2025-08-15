import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { PayloadValidationError, MultiStatusResponse, RequestClient, RetryableError, IntegrationError } from '@segment/actions-core'
import { SEGMENT_PARTNER_NAME, EBNotErrors, EBRetryableErrors, EBNotRetryableErrors } from './constants'
import { EventBridgeClient, PutPartnerEventsCommand, CreatePartnerEventSourceCommand, ListPartnerEventSourcesCommand, PutPartnerEventsCommandOutput } from '@aws-sdk/client-eventbridge'
import { PutPartnerEventsCommandJSON } from './types'
import { createCustomHandler } from './custom-http-handler'

export async function send(request: RequestClient, payloads: Payload[], settings: Settings): Promise<MultiStatusResponse> {
 
  const sourceId = payloads[0].sourceId

  if (!sourceId) {
    throw new PayloadValidationError('Source ID is required. It should be present at $.context.protocols.sourceId or $.projectId in the payload.')
  }

  const { accountId, region } = settings

  const client = new EventBridgeClient({ region, requestHandler: createCustomHandler(request) })

  await ensurePartnerSource(client, accountId, sourceId)

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

function buildMultiStatusResponse(response: PutPartnerEventsCommandOutput, payloads: Payload[]): MultiStatusResponse {
  const entries: PutPartnerEventsResultEntryList = response.Entries
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

async function ensurePartnerSource(client: EventBridgeClient, awsAccountId: string, sourceId: string) {
  const sourceExists = await findSource(client, sourceId)
  if (!sourceExists) {
    await createSource(client, awsAccountId, sourceId)
  }
}

async function findSource( client: EventBridgeClient, sourceId: string): Promise<boolean> {
  try {
    const command = new ListPartnerEventSourcesCommand({ NamePrefix: getFullSourceName(sourceId)})
    const response = await client.send(command)
    return (response.PartnerEventSources?.length ?? 0) > 0
  } 
  catch (error) {
    throwError(error, 'findSource')
  }
}

async function createSource(client: EventBridgeClient, accountId: string, sourceId: string) {
  const fullSourceName = getFullSourceName(sourceId)
  const command = new CreatePartnerEventSourceCommand({ Account: accountId, Name: fullSourceName})
  try {
    await client.send(command)
  } 
  catch (error) {
    if(isAnError(error)) {
      throwError(error, `createSource(${fullSourceName})`)
    }
  }
}

function getFullSourceName(sourceId: string): string {
  return `${SEGMENT_PARTNER_NAME}/${sourceId}`
}

function isAnError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return !(err.name in EBNotErrors)
  }
  return true
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