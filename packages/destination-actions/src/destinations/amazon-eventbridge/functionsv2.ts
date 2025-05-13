import { Payload } from './send/generated-types'
import { Settings } from './generated-types'
import { IntegrationError, MultiStatusResponse } from '@segment/actions-core'
import {
  EventBridgeClient,
  PutPartnerEventsCommand,
  CreatePartnerEventSourceCommand,
  ListPartnerEventSourcesCommand,
  PutPartnerEventsCommandOutput
} from '@aws-sdk/client-eventbridge'

export async function send(payloads: Payload[], settings: Settings): Promise<MultiStatusResponse> {
  return await process_data(payloads, settings)
}

async function process_data(events: Payload[], settings: Settings): Promise<MultiStatusResponse> {
  const client = new EventBridgeClient({ region: settings.awsRegion })
  const awsAccountId = settings.awsAccountId

  // Ensure the Partner Event Source exists before sending events
  await ensurePartnerSourceExists(
    client,
    awsAccountId,
    events[0].sourceId,
    settings.createPartnerEventSource || false,
    settings.partnerEventSourceName
  )

  const ebPayload = {
    Entries: events.map((event) => ({
      EventBusName: event.sourceId,
      Source: `${settings.partnerEventSourceName}/${event.sourceId}`,
      DetailType: String(event.detailType),
      Detail: JSON.stringify(event.data),
      Resources: event.resources ? [event.resources] : []
    }))
  }

  const command = new PutPartnerEventsCommand(ebPayload)
  const response: PutPartnerEventsCommandOutput = await client.send(command)

  const entries = response.Entries ?? []
  // Initialize MultiStatusResponse
  const multiStatusResponse = new MultiStatusResponse()
  events.forEach((event, index) => {
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
        body: 'Event sent successfully',
        sent: JSON.stringify(event)
      })
    }
  })
  return multiStatusResponse
}

async function ensurePartnerSourceExists(
  client: EventBridgeClient,
  awsAccountId: string | undefined,
  sourceId: unknown,
  createPartnerEventSource: boolean,
  partnerEventSourceName: string | undefined
) {
  const namePrefix = `${partnerEventSourceName}/${sourceId}`

  const listCommand = new ListPartnerEventSourcesCommand({ NamePrefix: namePrefix })
  const listResponse = await client.send(listCommand)

  if (listResponse?.PartnerEventSources && listResponse.PartnerEventSources.length > 0) {
    return true
  }

  if (createPartnerEventSource) {
    await create_partner_source(client, awsAccountId, namePrefix)
  } else {
    throw new IntegrationError(
      `Partner Event Source ${namePrefix} does not exist.`,
      'PARTNER_EVENT_SOURCE_NOT_FOUND',
      400
    )
  }
}

async function create_partner_source(
  client: EventBridgeClient,
  aws_account_id: string | undefined,
  partnerEventSourceName: string
) {
  const command = new CreatePartnerEventSourceCommand({
    Account: aws_account_id,
    Name: partnerEventSourceName
  })
  const response = await client.send(command)
  return response
}
