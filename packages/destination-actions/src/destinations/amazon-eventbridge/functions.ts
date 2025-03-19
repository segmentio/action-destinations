import { Payload } from './send/generated-types'
import { Settings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import {
  EventBridgeClient,
  PutPartnerEventsCommand,
  CreatePartnerEventSourceCommand,
  ListPartnerEventSourcesCommand
} from '@aws-sdk/client-eventbridge'

export async function send(payloads: Payload[], settings: Settings): Promise<void> {
  await process_data(payloads, settings)
}

async function process_data(events: Payload[], settings: Settings) {
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

  const eb_payload = {
    Entries: events.map((event) => ({
      EventBusName: event.sourceId,
      Source: `${settings.partnerEventSourceName}/${event.sourceId}`,
      DetailType: String(event.detailType),
      Detail: JSON.stringify(event.data),
      Resources: event.resources ? [event.resources] : []
    }))
  }
  const command = new PutPartnerEventsCommand(eb_payload)
  const response = await client.send(command)

  // Check for errors in the response
  if (response.FailedEntryCount && response.FailedEntryCount > 0) {
    const errors = response.Entries?.filter((entry) => entry.ErrorCode || entry.ErrorMessage)
    const errorMessage = errors?.map((err) => `Error: ${err.ErrorCode}, Message: ${err.ErrorMessage}`).join('; ')
    throw new Error(`EventBridge failed with ${response.FailedEntryCount} errors: ${errorMessage}`)
    //throw new Error(`Failed to send ${response.FailedEntryCount} events: ${JSON.stringify(errors)}`)
  }

  return response
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
    return true // Source exists
  }

  // If we reach here, the source does not exist
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
