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
  CachableSchema,
  SchemaDiff,
  PropertyCreateResp
} from './types'
import { Client } from './client'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, CachableSchema>({
  max: 2000,
  ttl: 1000 * 60 * 60
})

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
  return { name: event_name, primaryObject: payload.record_details.object_type, properties: props }
}

export function getSchemaFromCache(
  name: string,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext
): CachableSchema | undefined {
  if (!subscriptionMetadata || !subscriptionMetadata?.actionConfigId) {
    statsContext?.statsClient?.incr('cache.get.error', 1, statsContext?.tags)
    return undefined
  }

  const schema: CachableSchema | undefined = cache.get(`${subscriptionMetadata.actionConfigId}-${name}`) ?? undefined

  if (schema === undefined) {
    statsContext?.statsClient?.incr('cache.get.miss', 1, statsContext?.tags)
  } else {
    statsContext?.statsClient?.incr('cache.get.hit', 1, statsContext?.tags)
  }

  return schema
}

export async function saveSchemaToCache(
  schema: CachableSchema,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext
) {
  if (!subscriptionMetadata || !subscriptionMetadata?.actionConfigId) {
    statsContext?.statsClient?.incr('cache.save.error', 1, statsContext?.tags)
    return
  }

  cache.set(`${subscriptionMetadata.actionConfigId}-${schema.name}`, schema)
  statsContext?.statsClient?.incr('cache.save.success', 1, statsContext?.tags)
}

export function compareSchemas(schema1: Schema, schema2: CachableSchema | undefined): SchemaDiff {
  if (schema2 === undefined) {
    return { match: 'no_match', missingProperties: {} }
  }

  if (schema1.name !== schema2.name || schema1.name !== schema2.fullyQualifiedName) {
    return { match: 'mismatch', missingProperties: {} }
  }

  const missingProperties: { [key: string]: SegmentProperty } = {}

  for (const [key, prop1] of Object.entries(schema1.properties)) {
    const prop2 = schema2.properties[key]
    if (prop2 === undefined) {
      missingProperties[key] = prop1
      continue
    }
    if (prop1.stringFormat === prop2.stringFormat && prop1.type === prop2.type) {
      continue
    } else {
      return { match: 'mismatch', missingProperties: {} }
    }
  }

  return {
    match: Object.keys(missingProperties).length > 0 ? 'properties_missing' : 'full_match',
    missingProperties
  }
}

export async function getSchemaFromHubspot(client: Client, schema: Schema): Promise<CachableSchema | undefined> {
  const response = await client.getEventDefinition(schema.name)

  switch (response.status) {
    case 200: {
      const { name, fullyQualifiedName, properties: hsProperties, archived } = response.data

      if (archived) {
        return undefined
      }

      const cacheableSchema: CachableSchema = {
        name,
        fullyQualifiedName,
        primaryObject: '',
        properties: (() => {
          const props: { [key: string]: SegmentProperty } = {}

          for (const propName in schema.properties) {
            const maybeMatch = hsProperties.find((hsProp) => hsProp.name === propName)
            const prop = schema.properties[propName]

            if (maybeMatch === undefined) {
              continue
            }

            if (maybeMatch?.archived === true) {
              throw new PayloadValidationError(
                `Hubspot.CustomEvent.getSchemaFromHubspot: Property ${propName} is archived`
              )
            }

            if (['object', 'string', 'boolean'].includes(prop.type) && maybeMatch.type === 'number') {
              throw new PayloadValidationError(
                `Hubspot.CustomEvent.getSchemaFromHubspot: Expected type ${prop.type} for property ${propName} - Hubspot returned type ${maybeMatch.type}`
              )
            }

            if (prop.type === 'number' && ['datetime', 'string', 'enumeration'].includes(maybeMatch.type)) {
              throw new PayloadValidationError(
                `Hubspot.CustomEvent.getSchemaFromHubspot: Expected type ${prop.type} for property ${propName} - Hubspot returned type ${maybeMatch.type}`
              )
            }

            props[propName] = schema.properties[propName]
          }
          return props
        })()
      }

      return cacheableSchema
    }
    case 400:
    case 404:
      return undefined
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
      throw new RetryableError('Hubspot:CustomEvent:getSchemaFromHubspot: Retryable error', response.status)
    default:
      throw new IntegrationError(
        `Hubspot.CustomEvent.getSchemaFromHubspot: ${response?.statusText ? response.statusText : 'Unexpected Error'}`,
        'UNEXPECTED_ERROR',
        response.status
      )
  }
}

export async function createHubspotEventSchema(client: Client, schema: Schema): Promise<string> {
  const json: CreateEventDefinitionReq = {
    label: schema.name,
    name: schema.name,
    description: `${schema.name} - (created by Segment)`,
    primaryObject: schema.primaryObject,
    propertyDefinitions: Object.entries(schema.properties).map(([name, { type, stringFormat }]) => {
      return propertyBody(schema.name, type, name, stringFormat)
    })
  }

  const response = await client.createEventDefinition(json)

  switch (response.status) {
    case 201:
    case 200: {
      return response.data.fullyQualifiedName
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

export async function updateHubspotSchema(client: Client, fullyQualifiedName: string, schemaDiff: SchemaDiff) {
  const requests: Promise<{}>[] = []

  Object.keys(schemaDiff.missingProperties).forEach((propName) => {
    const { type, stringFormat } = schemaDiff.missingProperties[propName]
    const json = propertyBody(fullyQualifiedName, type, propName, stringFormat)
    requests.push(client.createPropertyDefinition(json, fullyQualifiedName))
  })

  const responses = await Promise.allSettled(requests)

  for (const response of responses) {
    if (response.status === 'fulfilled') {
      const {
        status,
        statusText,
        data: { message }
      } = response.value as PropertyCreateResp

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
