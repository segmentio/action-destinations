import type { Payload } from './generated-types'
import { StateContext, IntegrationError, PayloadValidationError, omit } from '@segment/actions-core'
import { UnixTimestamp13, EventItem, Type } from './types'
import { LOCAL_TESTING, SUPPORTED_TYPES, TRACK } from './constants'
import { OptimizelyWebClient } from './client'

export function validate(payload: Payload, stateContext?: StateContext) {
  const {
    eventMatching: { eventName, eventKey, eventId },
    eventType,
    tags: { value, revenue, quantity, currency, ...restTags } = {},
    timestamp,
    properties,
  } = payload

  if(!eventName && !eventKey && !eventId){
    throw new PayloadValidationError('One of eventName, eventKey or eventId is required')
  }

  if (!stateContext && !LOCAL_TESTING) {
    throw new IntegrationError('stateContext is not available', 'MISSING_STATE_CONTEXT', 400)
  }

  if(!SUPPORTED_TYPES.includes(eventType)){
    throw new PayloadValidationError(`Event type ${eventType} is not supported. Supported types are ${SUPPORTED_TYPES.join(', ')}`)
  }

  const unixTimestamp13: UnixTimestamp13 = new Date(timestamp as string).getTime() as UnixTimestamp13

  if (!isUnixTimestamp13(unixTimestamp13)) {
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

export function isUnixTimestamp13(value: number): value is UnixTimestamp13 {
  return value.toString().length === 13
}

export function isPrimitive(
  value: unknown,
  typesToCheck: Array<'string' | 'boolean' | 'number'> = ['string', 'boolean', 'number']
): boolean {
  const type = typeof value
  return typesToCheck.includes(type as 'string' | 'boolean' | 'number')
}

export function areAllPropertiesPrimitive(
  obj: Record<string, unknown> | undefined,
  typesToCheck: Array<'string' | 'boolean' | 'number'> = ['string', 'boolean', 'number']
): boolean {
  if (obj === undefined || Object.keys(obj).length === 0) {
    return true
  }
  return Object.values(obj).every((value) => isPrimitive(value, typesToCheck))
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
    if(createEventIfNotFound === 'CREATE'){
      event = await ensureEvent(client, idType, idValue, category, eventType as Type, pageUrl)
    } else {
      throw new PayloadValidationError(`Event with ${idType} = ${idValue} not found in Optimizely. "Create If Not Found" field set to "Do not create" which prevents Segment from creating the event.`)
    }
  } 

  if(!event) {
    throw new PayloadValidationError(`Error attempting to find event with ${idType} = ${idValue} in Optimizely`)
  }

  return event.id.toString()
}

export function getIdentifier(eventKey?: string, eventName?: string): {idType: string, idValue: string} {
  if(!eventKey && !eventName) {
    throw new IntegrationError(`Event Key or Event Name is required if eventId not provided`, 'EVENT_IDENTIFIER_REQUIRED', 400)
  }
  const idType = eventKey ? 'key' : 'name'
  const idValue = eventKey ?? eventName as string
  return { idType, idValue }
}

export function getEventFromCache(client: OptimizelyWebClient, type: string, value: string): EventItem | undefined {
  return getEventsFromCache(client).find((event: EventItem) => {      
    return (type==='key' && event.key === value) || (type==='name' && event.name === value)
  })
}

export function getEventsFromCache(client: OptimizelyWebClient): EventItem[] {
  return (client.stateContext?.getRequestContext?.('events') as EventItem[]) ?? []
}




export async function ensureEvent(client: OptimizelyWebClient, idType: string, idValue: string, category: string, type: Type, pageUrl?: string): Promise<EventItem>{
  let event =  await getEventFromOptimzely(client, idType, idValue, 'track')
  if (typeof event === undefined) {
    event = await createCustomEvent(client, idType, idValue, category)
    await updateCache(client, event)
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

export async function ensurePage(client: OptimizelyWebClient, idType: string, idValue: string, category: string, pageUrl?: string): Promise<EventItem>{
  let event =  await getPageEventFromOptimzely(client, idType, idValue)
  if (typeof event === undefined) {
    if(!pageUrl) {
      throw new PayloadValidationError(`Page URL is required for Segment to create a page event in Optimizely`)
    }
    event = await createPageEvent(client, idType, idValue, category, pageUrl)
    await updateCache(client, event)
  }
  if (!event) {
    throw new IntegrationError(
      `Enable to create page with page ${idType} = ${idValue} in Optimizely`,
      'EVENT_CREATION_ERROR',
      400
    )
  }
  return event
}

export async function getEventFromOptimzely(client: OptimizelyWebClient, idType: string, idValue: string, type: Type): Promise<EventItem | undefined> {
  const response = type === 'track' ? await client.getCustomEvents() : await client.getPageEvents()
  const eventItems: EventItem[] = await response.json()
  return eventItems.find((event: EventItem) => {
    return (idType==='key' && event.key === idValue) || (idType==='name' && event.name === idValue)
  })
}

export async function createCustomEvent(client: OptimizelyWebClient, idType: string, idValue: string, category: string): Promise<EventItem | undefined> {
  const response = await client.createCustomEvent(idType, idValue, category, 'track')
  const event = await response.json()
  return event ?? undefined
}

export async function updateCache(client: OptimizelyWebClient, event: EventItem) {
  const events = getEventsFromCache(client)
  events.push(event)
  client.stateContext?.setResponseContext?.(`events`, String(events), {})
}