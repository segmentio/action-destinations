import { PayloadValidationError, IntegrationError, RetryableError, StatsContext } from '@segment/actions-core'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import type { Payload } from './generated-types'
import {
  CreateEventDefinitionReq,
  CreatePropDefinitionReq,
  SegmentProperty,
  SegmentPropertyType,
  StringFormat,
  Schema,
  SchemaDiff,
  EventCompletionReq
} from './types'
import { Client } from './client'
import LRUCache = require('lru-cache')

const options: LRUCache.Options<string, Schema> = {
  max: 2000,
  ttl: 1000 * 60 * 60
}

const cache = new LRUCache<string, Schema>(options)

export function validate(payload: Payload): Payload {
  if (payload.record_details.object_type !== 'contact' && typeof payload.record_details.object_id !== 'number') {
    throw new PayloadValidationError('object_id is required and must be numeric')
  }

  if (
    payload.record_details.object_type === 'contact' &&
    typeof payload.record_details.object_id !== 'number' &&
    !payload.record_details.email &&
    !payload.record_details.utk
  ) {
    throw new PayloadValidationError(
      'Contact requires at least one of object_id (as number), email or utk to be provided'
    )
  }

  cleanIdentifiers(payload)
  payload.event_name = cleanEventName(payload.event_name)
  payload.properties = cleanPropObj(payload.properties ?? {})

  return payload
}

function cleanIdentifiers(payload: Payload) {
  if (payload.record_details.email && payload.record_details.object_type !== 'contact') {
    delete payload.record_details.email
  }

  if (payload.record_details.utk && payload.record_details.object_type !== 'contact') {
    delete payload.record_details.utk
  }
}

export function cleanEventName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
}

function cleanPropObj(
  obj: { [k: string]: unknown } | undefined
): { [k: string]: string | number | boolean } | undefined {
  const cleanObj: { [k: string]: string | number | boolean } = {}

  if (obj === undefined) {
    return undefined
  }

  Object.keys(obj).forEach((key) => {
    const value = obj[key]
    const cleanKey = cleanProp(key)

    if (typeof value === 'boolean' || typeof value === 'number') {
      cleanObj[cleanKey] = value
    } else if (typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
      // If the value can be cast to a boolean
      cleanObj[cleanKey] = value.toLowerCase() === 'true'
    } else if (!isNaN(Number(value))) {
      // If the value can be cast to a number
      cleanObj[cleanKey] = Number(value)
    } else if (typeof value === 'object' && value !== null) {
      // If the value is an object
      cleanObj[cleanKey] = JSON.stringify(value)
    } else {
      // If the value is anything else then stringify it
      cleanObj[cleanKey] = String(value)
    }
  })
  return cleanObj
}

function cleanProp(str: string): string {
  str = str.toLowerCase().replace(/[^a-z0-9_]/g, '_')

  if (!/^[a-z]/.test(str)) {
    throw new PayloadValidationError(
      `Property ${str} in event has an invalid name. Property names must start with a letter.`
    )
  }

  return str
}

function stringFormat(str: string): StringFormat {
  // Check for date or datetime, otherwise default to string
  const isoDateTimeRegex =
    /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/ //eslint-disable-line no-useless-escape
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/ //eslint-disable-line no-useless-escape

  if (isoDateTimeRegex.test(str)) {
    return dateOnlyRegex.test(str) ? 'date' : 'datetime'
  } else {
    return 'string'
  }
}

function propertyBody(
  eventName: string,
  type: SegmentPropertyType,
  name: string,
  stringFormat?: StringFormat
): CreatePropDefinitionReq {
  switch (type) {
    case 'number':
      return {
        name: name,
        label: name,
        type: 'number',
        description: `${name} - (created by Segment)`
      }
    case 'object':
      return {
        name: name,
        label: name,
        type: 'string',
        description: `${name} - (created by Segment)`
      }
    case 'boolean':
      return {
        name: name,
        label: name,
        type: 'enumeration',
        description: `${name} - (created by Segment)`,
        options: [
          {
            label: 'true',
            value: true,
            hidden: false,
            description: 'True',
            displayOrder: 1
          },
          {
            label: 'false',
            value: false,
            hidden: false,
            description: 'False',
            displayOrder: 2
          }
        ]
      }
    case 'string':
      switch (stringFormat as StringFormat) {
        case 'string':
          return {
            name: name,
            label: name,
            type: 'string',
            description: `${name} - (created by Segment)`
          }
        case 'date':
        case 'datetime':
          return {
            name: name,
            label: name,
            type: 'datetime',
            description: `${name} - (created by Segment)`
          }
        case undefined:
        default:
          throw new PayloadValidationError(`Property ${name} in event ${eventName} has an unsupported type: ${type}`)
      }
    default:
      throw new PayloadValidationError(`Property ${name} in event ${eventName} has an unsupported type: ${type}`)
  }
}

export function eventSchema(payload: Payload): Schema {
  const { event_name, properties } = payload
  const props: { [key: string]: SegmentProperty } = {}

  if (properties) {
    Object.entries(properties).forEach(([property, value]) => {
      if (value !== null) {
        props[property] = {
          type: typeof value as SegmentPropertyType,
          stringFormat: typeof value === 'string' ? stringFormat(value) : undefined
        }
      }
    })
  }
  return { eventName: event_name, primaryObject: payload.record_details.object_type, properties: props }
}

export function getSchemaFromCache(eventName: string, subscriptionMetadata?: SubscriptionMetadata, statsContext: StatsContext): Schema | undefined {
  if(!subscriptionMetadata || !subscriptionMetadata?.actionConfigId) {
    statsContext?.statsClient?.incr('cache.miss', 1, statsContext?.tags)
    return undefined
  }
  return cache.get(`${subscriptionMetadata.actionConfigId}-${eventName}`) ?? undefined 
}

export async function saveSchemaToCache(schema: Schema, subscriptionMetadata?: SubscriptionMetadata, statsContext: StatsContext) {
  if(!subscriptionMetadata || !subscriptionMetadata?.actionConfigId) {
    
    
    return 
  }
  statsContext?.statsClient?.incr('cache.save', 1, statsContext?.tags)
  cache.set(`${subscriptionMetadata.actionConfigId}-${schema.eventName}`, schema)
}

export function compareToCache(schema1: Schema, schema2: Schema | undefined): SchemaDiff {
  
  if(schema2 === undefined){
    return { match: 'no_match', missingProperties: {} }
  }

  const missingProperties: { [key: string]: SegmentProperty } = {}

  for (const [key, prop1] of Object.entries(schema1.properties)) {
    const prop2 = schema2.properties[key]
    if(prop2 === undefined){
      missingProperties[key] = prop1
      continue
    }
    if(prop1.stringFormat === prop2.stringFormat && prop1.type === prop2.type){
      continue
    } else {
      return { match: 'mismatch', missingProperties: {} }
    }
  }

  return { 
    fullyQualifiedName: schema1.eventName, 
    name: schema1.eventName, 
    match: Object.keys(missingProperties).length>0 ? 'properties_missing' : 'full_match', 
    missingProperties 
  }
}

export async function compareToHubspot(client: Client, schema: Schema): Promise<SchemaDiff> {
  const mismatchSchemaDiff: SchemaDiff = { match: 'mismatch', missingProperties: {} }

  const response = await client.getEventDefinition(schema.eventName)
  switch (response.status) {
    case 200: {
      const { fullyQualifiedName, name, properties: hsProperties, archived } = response.data

      if (archived) {
        return mismatchSchemaDiff
      }

      const schemaDiff = { missingProperties: {} } as SchemaDiff

      for (const propName in schema.properties) {
        const matchedProperty = hsProperties.find((hsProp) => hsProp.name === propName)

        if (matchedProperty?.archived === true) {
          return mismatchSchemaDiff
        }

        const prop = schema.properties[propName]

        if (
          (['object', 'string', 'boolean'].includes(prop.type) && matchedProperty?.type === 'number') ||
          (['datetime', 'string', 'enumeration'].includes(matchedProperty?.type as string) && prop.type === 'number')
        ) {
          return mismatchSchemaDiff
        }

        if (!matchedProperty) {
          schemaDiff.missingProperties[propName] = schema.properties[propName]
        }
      }

      schemaDiff.match = Object.keys(schemaDiff.missingProperties).length === 0 ? 'full_match' : 'properties_missing'
      schemaDiff.fullyQualifiedName = fullyQualifiedName
      schemaDiff.name = name

      return schemaDiff
    }
    case 400:
    case 404:
      return { match: 'no_match', missingProperties: {} }
    case 408:
    case 423:
    case 429:
    case 500:
    case 502:
    case 503:
    case 504:
    case 505:
    case 506:
    case 507:
    case 508:
    case 509:
    case 510:
    case 511:
    case 598:
    case 599:
      throw new RetryableError('Hubspot:CustomEvent:compareToHubspot: Retryable error', response.status)
    default:
      throw new IntegrationError(
        `Hubspot.CustomEvent.compareToHubspot: ${response?.statusText ? response.statusText : 'Unexpected Error'}`,
        'UNEXPECTED_ERROR',
        response.status
      )
  }
}

export async function sendEvent(client: Client, fullyQualifiedName: string, payload: Payload) {
  const { record_details, properties, occurred_at: occurredAt } = payload
  const eventName = fullyQualifiedName

  const json: EventCompletionReq = {
    eventName,
    objectId: record_details.object_id ?? undefined,
    email: record_details.email ?? undefined,
    utk: record_details.utk ?? undefined,
    occurredAt,
    properties: properties
  }
  return await client.send(json)
}

export async function createHubspotEventSchema(client: Client, schema: Schema): Promise<SchemaDiff> {
  const json: CreateEventDefinitionReq = {
    label: schema.eventName,
    name: schema.eventName,
    description: `${schema.eventName} - (created by Segment)`,
    primaryObject: schema.primaryObject,
    propertyDefinitions: Object.entries(schema.properties).map(([name, { type, stringFormat }]) => {
      return propertyBody(schema.eventName, type, name, stringFormat)
    })
  }

  const response = await client.createEventDefinition(json)
  switch (response.status) {
    case 201:
    case 200: {
      return {
        match: 'full_match',
        fullyQualifiedName: response.data.fullyQualifiedName,
        name: response.data.name
      } as SchemaDiff
    }
    case 409: {
      // If the event schema already exists, we can ignore the error and retry later
      if (response.data.message.includes('already exists')) {
        throw new RetryableError('Hubspot:CustomEvent:createHubspotEventSchema: Event schema already exists', 429)
      } else {
        throw new IntegrationError(
          `Hubspot.CustomEvent.createHubspotEventSchema: ${
            response?.statusText ? response.statusText : 'Unexpected Error'
          }`,
          'UNEXPECTED_ERROR',
          response.status
        )
      }
    }
    case 408:
    case 423:
    case 429:
    case 500:
    case 502:
    case 503:
    case 504:
    case 505:
    case 506:
    case 507:
    case 508:
    case 509:
    case 510:
    case 511:
    case 598:
    case 599:
      throw new RetryableError('Hubspot:CustomEvent:createHubspotEventSchema: Rate limit reached')
    default:
      throw new IntegrationError(
        `Hubspot.CustomEvent.createHubspotEventSchema: ${
          response?.statusText ? response.statusText : 'Unexpected Error'
        }`,
        'UNEXPECTED_ERROR',
        response.status
      )
  }
}

interface PropertyCreateResponseValue {
  status: number
  statusText: string
  data: {
    message: string
  }
}

export async function updateHubspotSchema(client: Client, fullyQualifiedName: string, schemaDiff: SchemaDiff) {
  console.log("updateHubspotSchema")
  
  const requests: Promise<{}>[] = []

  Object.keys(schemaDiff.missingProperties).forEach((propName) => {
    const { type, stringFormat } = schemaDiff.missingProperties[propName]
    const json = propertyBody(schemaDiff?.fullyQualifiedName as string, type, propName, stringFormat)
    requests.push(client.createPropertyDefinition(json, fullyQualifiedName))
  })

  const responses = await Promise.allSettled(requests)

  for (const response of responses) {
    if (response.status === 'fulfilled') {
      const {
        status,
        statusText,
        data: { message }
      } = response.value as PropertyCreateResponseValue

      switch (status) {
        case 201:
        case 200:
          return
        case 409: {
          // If the property already exists, we can ignore the error
          if (message.includes('already exists')) {
            return
          } else {
            throw new IntegrationError(
              `Hubspot.CustomEvent.updateHubspotSchema: ${statusText ? statusText : 'Unexpected Error'}. ${
                message ? message : ''
              }`,
              'UNEXPECTED_ERROR',
              status
            )
          }
        }
        case 408:
        case 423:
        case 429:
        case 500:
        case 502:
        case 503:
        case 504:
        case 505:
        case 506:
        case 507:
        case 508:
        case 509:
        case 510:
        case 511:
        case 598:
        case 599:
          throw new RetryableError(
            'Hubspot:CustomEvent:updateHubspotSchema: Retryable response status received',
            status
          )
        default: {
          throw new IntegrationError(
            `Hubspot.CustomEvent.updateHubspotSchema: ${statusText ? statusText : 'Unexpected Error'}. ${
              message ? message : ''
            }`,
            'UNEXPECTED_ERROR',
            status
          )
        }
      }
    }

    if (response.status === 'rejected') {
      // rejected likely means a network layer error, so retry
      throw new RetryableError('Hubspot:CustomEvent:updateHubspotSchema: promise.allSettled rejected - retrying', 429)
    }
  }
}
