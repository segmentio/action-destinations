import type { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { StateContext, IntegrationError, PayloadValidationError, omit, RequestClient } from '@segment/actions-core'
import { Event, UnixTimestamp13, EventItem, Type, SendEventJSON } from './types'
import { LOCAL_TESTING, SUPPORTED_TYPES, PAGE } from './constants'
import { OptimizelyWebClient } from './client'

export async function send(request: RequestClient, settings: Settings, payload: Payload, stateContext?: StateContext) {
  const { unixTimestamp13, opt_event_properties, value, revenue, quantity, currency, restTags } = validate(
    payload,
    stateContext
  )

  const {
    endUserId,
    projectID,
    uuid,
    eventMatching: { eventId, eventName, eventKey },
    eventType
  } = payload

  const client = new OptimizelyWebClient(request, settings, projectID, stateContext)

  const entity_id = eventId ?? (await getEventid(client, payload))

  const body: SendEventJSON = {
    account_id: settings.optimizelyAccountId,
    anonymize_ip: payload.anonymizeIP,
    client_name: 'Segment Optimizely Web Destination',
    client_version: '1.0.0',
    enrich_decisions: true,
    visitors: [
      {
        visitor_id: endUserId,
        attributes: [],
        snapshots: [
          {
            decisions: [],
            events: [
              {
                entity_id,
                key: (eventKey ?? eventName) as string,
                timestamp: unixTimestamp13,
                uuid,
                type: eventType === PAGE ? 'view_activated' : 'other',
                tags: {
                  revenue: revenue ? revenue * 100 : undefined,
                  value,
                  quantity,
                  currency,
                  $opt_event_properties: opt_event_properties as Event['tags']['$opt_event_properties'],
                  ...restTags
                }
              }
            ]
          }
        ]
      }
    ]
  }
  return await client.sendEvent(body)
}

export function validate(payload: Payload, stateContext?: StateContext) {
  const {
    eventMatching: { eventName, eventKey, eventId },
    eventType,
    tags: { value, revenue, quantity, currency, ...restTags } = {},
    timestamp,
    properties
  } = payload

  if (!eventName && !eventKey && !eventId) {
    throw new PayloadValidationError('One of eventName, eventKey or eventId is required')
  }

  if (!stateContext && !LOCAL_TESTING) {
    throw new IntegrationError('stateContext is not available', 'MISSING_STATE_CONTEXT', 400)
  }

  if (!SUPPORTED_TYPES.includes(eventType)) {
    throw new PayloadValidationError(
      `Event type ${eventType} is not supported. Supported types are ${SUPPORTED_TYPES.join(', ')}`
    )
  }

  const unixTimestamp13: UnixTimestamp13 = new Date(timestamp as string).getTime() as UnixTimestamp13

  if (unixTimestamp13.toString().length !== 13) {
    throw new PayloadValidationError('Unable to convert timestamp into 13 digit Unix timestamp')
  }

  const opt_event_properties = omit(properties, ['revenue', 'value', 'quantity', 'currency'])

  if (!areAllPropertiesPrimitive(opt_event_properties, ['string', 'number', 'boolean'])) {
    throw new PayloadValidationError('Event properties must be of type string, number or boolean')
  }

  if (!areAllPropertiesPrimitive(restTags as Record<string, unknown>, ['string', 'number'])) {
    throw new PayloadValidationError('Tags must be of type string or number')
  }

  return {
    unixTimestamp13,
    opt_event_properties,
    value,
    revenue,
    quantity,
    currency,
    restTags
  }
}

export function areAllPropertiesPrimitive(
  obj: Record<string, unknown> | undefined,
  typesToCheck: Array<'string' | 'boolean' | 'number'> = ['string', 'boolean', 'number']
): boolean {
  if (obj === undefined || Object.keys(obj).length === 0) {
    return true
  }
  return Object.values(obj).every((value) => {
    const type = typeof value
    return typesToCheck.includes(type as 'string' | 'boolean' | 'number')
  })
}

export async function getEventid(client: OptimizelyWebClient, payload: Payload): Promise<string> {
  const {
    category,
    eventMatching: { createEventIfNotFound, eventName, eventKey },
    eventType,
    pageUrl
  } = payload

  const { idType, idValue } = getIdentifier(eventKey, eventName)

  let event = getEventFromCache(client, idType, idValue)

  if (typeof event === undefined) {
    if (createEventIfNotFound === 'CREATE') {
      event = await ensureEventSchema(client, idType, idValue, category, eventType as Type, pageUrl)
    } else {
      throw new PayloadValidationError(
        `Event with ${idType} = ${idValue} not found in Optimizely. "Create If Not Found" field set to "Do not create" which prevents Segment from creating the event.`
      )
    }
  }

  if (!event) {
    throw new PayloadValidationError(`Error attempting to find event with ${idType} = ${idValue} in Optimizely`)
  }

  return event.id.toString()
}

export function getIdentifier(eventKey?: string, eventName?: string): { idType: string; idValue: string } {
  if (!eventKey && !eventName) {
    throw new IntegrationError(
      `Event Key or Event Name is required if eventId not provided`,
      'EVENT_IDENTIFIER_REQUIRED',
      400
    )
  }
  const idType = eventKey ? 'key' : 'name'
  const idValue = eventKey ?? (eventName as string)
  return { idType, idValue }
}

export function getEventFromCache(client: OptimizelyWebClient, type: string, value: string): EventItem | undefined {
  return getEventsFromCache(client).find((event: EventItem) => {
    return (type === 'key' && event.key === value) || (type === 'name' && event.name === value)
  })
}

export function getEventsFromCache(client: OptimizelyWebClient): EventItem[] {
  return (client.stateContext?.getRequestContext?.('events') as EventItem[]) ?? []
}

export async function ensureEventSchema(
  client: OptimizelyWebClient,
  idType: string,
  idValue: string,
  category: string,
  type: Type,
  pageUrl?: string
): Promise<EventItem> {
  let event = await (async () => {
    const response = await client.getCustomEvents(type)
    const eventItems: EventItem[] = await response.json()
    return eventItems.find((event: EventItem) => {
      return (idType === 'key' && event.key === idValue) || (idType === 'name' && event.name === idValue)
    })
  })()

  if (typeof event === undefined) {
    event = await (async () => {
      const response = await client.createCustomEvent(idType, idValue, category, type, pageUrl)
      const event = await response.json()
      return event
    })()

    await updateCache(client, event as EventItem)
  }
  if (!event) {
    throw new IntegrationError(
      `Enable to create event with event ${idType} = ${idValue} in Optimizely`,
      'EVENT_CREATION_ERROR',
      400
    )
  }
  return event
}

export async function updateCache(client: OptimizelyWebClient, event: EventItem) {
  const events = getEventsFromCache(client)
  events.push(event)
  client.stateContext?.setResponseContext?.(`events`, String(events), {})
}
