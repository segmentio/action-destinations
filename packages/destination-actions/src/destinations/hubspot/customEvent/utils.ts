import { PayloadValidationError, IntegrationError, RetryableError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import {
  CreateEventDefinitionRespErr,
  CreateEventDefinitionReq,
  CreatePropertyDefintionReq,
  CreatePropertyRegectedResp,
  ErrorResponse,
  SegmentProperty,
  SegmentPropertyType,
  StringFormat,
  Schema,
  SchemaDiff,
  EventCompletionReq
} from './types'
import { Client } from './client'

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
  const date = new Date(str)

  if (isNaN(date.getTime())) {
    return 'string'
  }

  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const seconds = date.getUTCSeconds()
  const milliseconds = date.getUTCMilliseconds()

  // Check if it's a date at midnight
  if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
    // Reconstruct the date at UTC midnight
    const reconstructedDate = new Date(Date.UTC(year, month, day))
    if (reconstructedDate.getTime() === date.getTime()) {
      return 'date'
    } else {
      return 'datetime'
    }
  }

  return 'datetime'
}

function propertyBody(
  eventName: string,
  type: SegmentPropertyType,
  name: string,
  stringFormat?: StringFormat
): CreatePropertyDefintionReq {
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

export async function compareToCache(_schema: Schema): Promise<SchemaDiff> {
  // no op function until caching implemented
  const schemaDiff: SchemaDiff = {
    match: 'no_match',
    missingProperties: {}
  }

  return Promise.resolve(schemaDiff)
}

export async function compareToHubspot(client: Client, schema: Schema): Promise<SchemaDiff> {
  const mismatchSchemaDiff: SchemaDiff = { match: 'mismatch', missingProperties: {} }

  try {
    const {
      fullyQualifiedName,
      name,
      properties: hsProperties,
      archived
    } = await client.getEventDefinition(schema.eventName)

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
  } catch {
    return { match: 'no_match', missingProperties: {} } as SchemaDiff
  }
}

export async function saveSchemaToCache(_fullyQualifiedName: string, _name: string, _schema: Schema) {
  return
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

  try {
    const response = await client.createEventDefinition(json)

    return {
      match: 'full_match',
      fullyQualifiedName: response.fullyQualifiedName,
      name: response.name
    } as SchemaDiff
  } catch (error) {
    const responseError = error as CreateEventDefinitionRespErr
    if (responseError.response.data.category === 'OBJECT_ALREADY_EXISTS') {
      throw new RetryableError()
    }
    throw new IntegrationError(
      `Error creating schema in HubSpot. ${responseError.response.data.message}`,
      'HUBSPOT_CREATE_SCHEMA_ERROR',
      400
    )
  }
}

export async function updateHubspotSchema(client: Client, fullyQualifiedName: string, schemaDiff: SchemaDiff) {
  const requests: Promise<{}>[] = []

  try {
    Object.keys(schemaDiff.missingProperties).forEach((propName) => {
      const { type, stringFormat } = schemaDiff.missingProperties[propName]
      const json = propertyBody(schemaDiff?.fullyQualifiedName as string, type, propName, stringFormat)
      requests.push(client.createPropertyDefinition(json, fullyQualifiedName))
    })

    const responses = await Promise.allSettled(requests)

    for (const response of responses) {
      if (response.status === 'rejected') {
        const error = response.reason as CreatePropertyRegectedResp
        if (error.data.propertiesErrorCode !== 'PROPERTY_EXISTS') {
          throw new IntegrationError(
            `Error updating schema in HubSpot. ${error.data.message || ''} ${error.data.propertiesErrorCode || ''}`,
            'HUBSPOT_UPDATE_SCHEMA_ERROR',
            400
          )
        }
      }
    }
  } catch (error) {
    const responseError = error as ErrorResponse
    throw new IntegrationError(`Error updating schema in HubSpot. ${responseError.code}`, `${responseError.code}`, 400)
  }
}
