import type { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import {
  ValidPayload,
  UnixTimestamp13,
  OptEventProperties,
  EventItem,
  EventProperties,
  EventItemWithProps,
  Type,
  SendEventJSON
} from './types'
import { SUPPORTED_TYPES, PAGE, MAX_CUSTOM_PROPS_PER_EVENT } from './constants'
import { OptimizelyWebClient } from './client'
import snakeCase from 'lodash/snakeCase'

export async function send(request: RequestClient, settings: Settings, payload: Payload) {
  const validPayload = validate(payload)

  const {
    unixTimestamp13,
    optEventProperties,
    uuid,
    endUserId: visitor_id,
    anonymizeIP: anonymize_ip,
    eventMatching: { eventId, eventKey, shouldSnakeCaseEventKey },
    tags,
    standardEventProperties: { revenue, value, quantity } = {},
    type,
    sessionId: session_id
  } = validPayload

  const client = new OptimizelyWebClient(request, settings)

  const entity_id = eventId ?? (await getEventid(client, validPayload))

  const body: SendEventJSON = {
    account_id: settings.optimizelyAccountId,
    project_id: settings.projectID,
    anonymize_ip,
    client_name: 'twilio_segment/optimizely_web_destination',
    client_version: '1.0.0',
    enrich_decisions: true,
    visitors: [
      {
        visitor_id,
        session_id,
        attributes: [],
        snapshots: [
          {
            decisions: [],
            events: [
              {
                entity_id,
                key: cleanKey(type, shouldSnakeCaseEventKey, eventKey),
                quantity,
                revenue: typeof revenue === 'number' ? revenue * 100 : undefined,
                tags: {
                  ...tags,
                  ...(Object.keys(optEventProperties ?? {}).length > 0 && {
                    $opt_event_properties: optEventProperties
                  })
                },
                timestamp: unixTimestamp13,
                type: type === PAGE ? 'view_activated' : 'other',
                uuid,
                value
              }
            ]
          }
        ]
      }
    ]
  }

  return await client.sendEvent(body)
}

export function validate(payload: Payload): ValidPayload {
  const {
    eventMatching: { eventKey, eventId, shouldSnakeCaseEventKey },
    eventType,
    tags,
    timestamp,
    customStringProperties,
    customNumericProperties,
    customBooleanProperties
  } = payload

  if (!eventKey && !eventId) {
    throw new PayloadValidationError('One of "Event Key" or "Event Id" is required')
  }

  if (!SUPPORTED_TYPES.includes(eventType)) {
    throw new PayloadValidationError(
      `Event type ${eventType} is not supported. Supported types are ${SUPPORTED_TYPES.join(', ')}`
    )
  }

  const type: Type = eventType as Type

  const unixTimestamp13: UnixTimestamp13 = new Date(timestamp as string).getTime() as UnixTimestamp13

  if (unixTimestamp13.toString().length !== 13) {
    throw new PayloadValidationError('Unable to convert timestamp into 13 digit Unix timestamp')
  }

  if (!validatePropType(customStringProperties, ['string'])) {
    throw new PayloadValidationError('Custom String Properties must be of type string')
  }

  if (!validatePropType(customNumericProperties, ['number'])) {
    throw new PayloadValidationError('Custom Numeric Properties must be of type number')
  }

  if (!validatePropType(customBooleanProperties, ['boolean'])) {
    throw new PayloadValidationError('Custom Boolean Properties must be of type boolean')
  }

  if (!validatePropType(tags as Record<string, unknown>, ['string', 'number'])) {
    throw new PayloadValidationError('Tags must be of type string or number')
  }

  const key = cleanKey(type, shouldSnakeCaseEventKey, eventKey)

  const optEventProperties = getCustomProps(payload)

  return {
    ...payload,
    unixTimestamp13,
    optEventProperties,
    type,
    key
  }
}

function getCustomProps(payload: Payload): OptEventProperties {
  const { customStringProperties, customNumericProperties, customBooleanProperties } = payload

  return {
    ...customStringProperties,
    ...customNumericProperties,
    ...customBooleanProperties
  } as OptEventProperties
}

export function validatePropType(
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

export async function getEventid(client: OptimizelyWebClient, payload: ValidPayload): Promise<string> {
  const {
    eventMatching: { createEventIfNotFound, eventId },
    type,
    key
  } = payload

  let event_id = eventId ?? (await searchDefinedEvents(client, key as string, type))

  if (event_id === undefined && createEventIfNotFound !== 'CREATE') {
    throw new PayloadValidationError(
      `Event with key = ${key} not found in Optimizely. The "Create If Not Found" field is set to "Do not create", which prevents Segment from defining the event in Optimizely.`
    )
  }

  if (event_id === undefined) {
    const newEventItemWithProps = await defineNewEvent(client, key as string, payload)
    event_id = newEventItemWithProps.id.toString()
    compareProps(payload.optEventProperties, newEventItemWithProps.event_properties, event_id)
  } else {
    await validatePropertyDefinitions(client, event_id, payload)
  }

  if (!event_id) {
    throw new PayloadValidationError(`Error attempting to find event with key = ${key} in Optimizely`)
  }
  return event_id
}

export function cleanKey(eventType: Type, shouldSnakeCaseEventKey: boolean, key?: string): string | undefined {
  if (!key) {
    return undefined
  }
  const maybeSnakeKey = shouldSnakeCaseEventKey ? snakeCase(key) : key
  return eventType === PAGE ? maybeSnakeKey.replace(/[^a-zA-Z0-9_]/g, '_') : maybeSnakeKey
}

export async function searchDefinedEvents(
  client: OptimizelyWebClient,
  key: string,
  type: Type
): Promise<string | undefined> {
  const response = await client.getCustomEvents(type)
  const eventItems: EventItem[] = await response.json()
  const event = eventItems.find((event: EventItem) => {
    return event.key === key
  })
  return event?.id.toString() ?? undefined
}

export async function validatePropertyDefinitions(
  client: OptimizelyWebClient,
  event_id: string,
  payload: ValidPayload
) {
  const { optEventProperties } = payload
  const response = await client.getCustomEvent(event_id)
  const eventItem: EventItemWithProps = await response.json()
  const definedProps = eventItem.event_properties ?? []
  compareProps(optEventProperties, definedProps, event_id)
}

function compareProps(
  optEventProperties: OptEventProperties = {},
  definedProps: EventProperties = [],
  event_id: string
) {
  Object.entries(optEventProperties ?? {}).forEach(([k, v]) => {
    const match = definedProps.find((p) => p.name == k)
    if (!match) {
      throw new PayloadValidationError(
        `Property: '${k}' is not defined in Optimizely event with event_id: '${event_id}'`
      )
    }
    if (match.data_type !== typeof v) {
      throw new PayloadValidationError(
        `Property: '${k}' is of type ${typeof v} but defined in Optimizely event with event_id: '${event_id}' as ${
          match.data_type
        }`
      )
    }
  })
}

export async function defineNewEvent(
  client: OptimizelyWebClient,
  key: string,
  payload: ValidPayload
): Promise<EventItemWithProps> {
  const { optEventProperties = {}, category, type, pageUrl } = payload
  if (Object.keys(optEventProperties).length > MAX_CUSTOM_PROPS_PER_EVENT) {
    throw new PayloadValidationError(
      `Optimizely supports a maximum of ${MAX_CUSTOM_PROPS_PER_EVENT} custom properties per event.`
    )
  }
  const response = await client.createCustomEvent(key, category, type, optEventProperties, pageUrl)
  const event = await response.json()
  return event
}
