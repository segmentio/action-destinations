import { Client } from '../client'
import { Payload } from '../generated-types'
import { EventCompletionReq } from '../types'

export async function sendEvent(client: Client, fullyQualifiedName: string, payload: Payload) {
  const { record_details, properties, occurred_at: occurredAt } = payload

  const json: EventCompletionReq = {
    eventName: fullyQualifiedName,
    objectId: record_details.object_id ?? undefined,
    email: record_details.email ?? undefined,
    utk: record_details.utk ?? undefined,
    occurredAt,
    properties: properties
  }
  return await client.send(json)
}
