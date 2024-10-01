import type { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { IntegrationError, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { Event, UnixTimestamp13, EventItem, Type, SendEventJSON } from './types'
import { SUPPORTED_TYPES, PAGE } from './constants'
import { OptimizelyWebClient } from './client'
import snakeCase from 'lodash/snakeCase'

export async function send(request: RequestClient, settings: Settings, payload: Payload) {
  const { unixTimestamp13, restProperties, value, revenue, quantity, currency, tags } = validate(payload)

  const {
    endUserId,
    sessionId: session_id,
    uuid,
    eventMatching: { eventId, eventKey, shouldSnakeCaseEventKey },
    eventType
  } = payload

  const client = new OptimizelyWebClient(request, settings)

  const entity_id = eventId ?? (await getEventid(client, payload))

  const body: SendEventJSON = {
    account_id: settings.optimizelyAccountId,
    project_id: settings.projectID,
    anonymize_ip: payload.anonymizeIP,
    client_name: 'Segment Optimizely Web Destination',
    client_version: '1.0.0',
    enrich_decisions: true,
    visitors: [
      {
        visitor_id: endUserId,
        session_id,
        attributes: [],
        snapshots: [
          {
            decisions: [],
            events: [
              {
                entity_id,
                key: cleanKey(eventType as Type, shouldSnakeCaseEventKey, eventKey),
                timestamp: unixTimestamp13,
                uuid,
                type: eventType === PAGE ? 'view_activated' : 'other',
                revenue: revenue ? revenue * 100 : undefined,
                value,
                tags: {
                  quantity,
                  currency,
                  $opt_event_properties: restProperties as Event['tags']['$opt_event_properties'],
                  ...tags
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

export function validate(payload: Payload) {
  const {
    eventMatching: { eventKey, eventId },
    eventType,
    tags,
    timestamp,
    properties: { value, revenue, quantity, currency, ...restProperties } = {}
  } = payload

  if (!eventKey && !eventId) {
    throw new PayloadValidationError('One of "Event Key" or "Event Id" is required')
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

  if (!areAllPropertiesPrimitive(restProperties, ['string', 'number', 'boolean'])) {
    throw new PayloadValidationError('Event properties must be of type string, number or boolean')
  }

  if (!areAllPropertiesPrimitive(tags as Record<string, unknown>, ['string', 'number'])) {
    throw new PayloadValidationError('Tags must be of type string or number')
  }

  return {
    unixTimestamp13,
    restProperties,
    value,
    revenue,
    quantity,
    currency,
    tags
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
    eventMatching: { createEventIfNotFound, eventKey, shouldSnakeCaseEventKey },
    eventType,
    pageUrl
  } = payload

  if (!eventKey) {
    throw new PayloadValidationError('Event key is required to get the event id')
  }

  const key = cleanKey(eventType as Type, shouldSnakeCaseEventKey, eventKey) as string

  const name = eventKey

  let event = getEventFromCache(key)

  if (event === undefined) {
    if (createEventIfNotFound === 'CREATE') {
      event = await ensureEventSchema(client, key, name, category, eventType as Type, pageUrl)
    } else {
      throw new PayloadValidationError(
        `Event with key = ${key} not found in Optimizely. "Create If Not Found" field set to "Do not create" which prevents Segment from creating the event.`
      )
    }
  }

  if (!event) {
    throw new PayloadValidationError(`Error attempting to find event with key = ${key} in Optimizely`)
  }

  return event.id.toString()
}

export function cleanKey(eventType: Type, shouldSnakeCaseEventKey: boolean, key?: string): string | undefined {
  if (!key) {
    return undefined
  }
  const maybeSnakeKey = shouldSnakeCaseEventKey ? snakeCase(key) : key
  return eventType === PAGE ? maybeSnakeKey.replace(/[^a-zA-Z0-9_]/g, '_') : maybeSnakeKey
}

export function getEventFromCache(key: string): EventItem | undefined {
  return getEventsFromCache().find((event: EventItem) => {
    return event.key === key
  })
}

export function getEventsFromCache(): EventItem[] {
  return []
}

export async function ensureEventSchema(
  client: OptimizelyWebClient,
  key: string,
  name: string,
  category: string,
  type: Type,
  pageUrl?: string
): Promise<EventItem> {
  let event = await (async () => {
    const response = await client.getCustomEvents(type)
    const eventItems: EventItem[] = await response.json()

    return eventItems.find((event: EventItem) => {
      return event.key === key
    })
  })()

  if (event === undefined) {
    event = await (async () => {
      const response = await client.createCustomEvent(key, name, category, type, pageUrl)
      const event = await response.json()
      return event
    })()
  }
  if (!event) {
    throw new IntegrationError(`Unable to create event with key ${key} in Optimizely`, 'EVENT_CREATION_ERROR', 400)
  }
  return event
}
