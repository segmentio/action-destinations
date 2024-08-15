import { RequestClient, PayloadValidationError, IntegrationError, RetryableError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'

export type SyncMode = 'upsert' | 'add' | 'update'

type StringFormat = 'date' | 'datetime' | 'string'

type SegmentPropertyType = 'number' | 'object' | 'boolean' | 'string'
interface SegmentProperty {
  type: SegmentPropertyType
  stringFormat?: StringFormat
}

type SchemaMatch = 'full_match' | 'properties_missing' | 'no_match' | 'mismatch'

interface SchemaDiff {
  match: SchemaMatch
  fullyQualifiedName?: string
  name?: string
  missingProperties: {
    [key: string]: SegmentProperty
  }
}

interface SegmentEventSchema {
  eventName: string
  properties: {
    [key: string]: SegmentProperty
  }
  primaryObject: string
}

type HubspotPropertyType = 'string' | 'number' | 'enumeration' | 'datetime'
interface PropertyRequestJSON {
  name: string
  label: string
  type: HubspotPropertyType
  description: string
  options?: Array<{
    label: string
    value: boolean
    description: string
    hidden: boolean
    displayOrder: number
  }>
}

export class HubspotClient {
  request: RequestClient
  syncMode: SyncMode

  constructor(request: RequestClient, syncMode: SyncMode) {
    this.request = request
    this.syncMode = syncMode
  }

  stringFormat(str: string): StringFormat {
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

  sanitizeEventName(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  }

  sanitizePropertyName(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  }

  sanitizeProperties(properties: { [k: string]: unknown }): { [k: string]: string | number | boolean } {
    const result: { [k: string]: string | number | boolean } = {}

    Object.keys(properties).forEach((key) => {
      const value = properties[key]
      const propName = this.sanitizePropertyName(key)

      if (!/^[a-z]/.test(propName)) {
        throw new PayloadValidationError(
          `Property ${key} in event has an invalid name. Property names must start with a letter.`
        )
      }

      result[propName] =
        typeof value === 'object' && value !== null ? JSON.stringify(value) : (value as string | number | boolean)
    })

    return result
  }

  propertyBody(
    eventName: string,
    type: SegmentPropertyType,
    name: string,
    stringFormat?: StringFormat
  ): PropertyRequestJSON {
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

  segmentSchema(payload: Payload): SegmentEventSchema {
    const { event_name, properties } = payload
    const sanitizedEventName = this.sanitizeEventName(event_name)
    const props: { [key: string]: SegmentProperty } = {}

    if (properties) {
      Object.entries(properties).forEach(([property, value]) => {
        if (value !== null) {
          props[property] = {
            type: typeof value as SegmentPropertyType,
            stringFormat: typeof value === 'string' ? this.stringFormat(value) : undefined
          }
        }
      })
    }
    return { eventName: sanitizedEventName, primaryObject: payload.record_details.object_type, properties: props }
  }

  async compareSchemaToCache(schema: SegmentEventSchema): Promise<SchemaDiff> {
    // no op function until caching implemented
    let data = JSON.stringify(`${schema}`)
    data = data.replace(data, '')
    console.log(`compared schema to cache: ${data}`)

    const schemaDiff: SchemaDiff = {
      match: 'no_match',
      missingProperties: {}
    }

    return Promise.resolve(schemaDiff)
  }

  async compareSchemaToHubspot(schema: SegmentEventSchema): Promise<SchemaDiff> {
    interface ResponseType {
      data: ResultItem
    }
    interface ResultItem {
      archived: boolean
      fullyQualifiedName: string
      name: string
      properties: Array<{
        archived: boolean
        name: string
        type: HubspotPropertyType
      }>
    }

    const mismatchSchemaDiff: SchemaDiff = { match: 'mismatch', missingProperties: {} }

    try {
      const url = `${HUBSPOT_BASE_URL}/events/v3/event-definitions/${schema.eventName}/?includeProperties=true`
      const response: ResponseType = await this.request(url, {
        method: 'GET',
        skipResponseCloning: true
      })

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
    } catch {
      return { match: 'no_match', missingProperties: {} } as SchemaDiff
    }
  }

  async saveSchemaToCache(fullyQualifiedName: string, name: string, schema: SegmentEventSchema) {
    // no op function until caching implemented
    let data = JSON.stringify(`${fullyQualifiedName} ${name} ${schema}`)
    data = data.replace(data, '')
    console.log(`saved schema to cache: ${data}`)
    return
  }

  async sendEvent(fullyQualifiedName: string, payload: Payload) {
    const { record_details, properties, occurred_at: occurredAt } = payload
    const eventName = fullyQualifiedName
    const url = `${HUBSPOT_BASE_URL}/events/v3/send`

    const json = {
      eventName,
      objectId: record_details.object_id ?? undefined,
      email: record_details.email ?? undefined,
      utk: record_details.utk ?? undefined,
      occurredAt,
      properties: properties ? this.sanitizeProperties(properties) : undefined
    }

    await this.request(url, {
      method: 'POST',
      json
    })
  }

  async send(payload: Payload) {
    payload.properties = this.sanitizeProperties(payload.properties ?? {})

    const schema = this.segmentSchema(payload)
    const cacheSchemaDiff = await this.compareSchemaToCache(schema)

    switch (cacheSchemaDiff.match) {
      case 'full_match':
        return await this.sendEvent(cacheSchemaDiff?.fullyQualifiedName as string, payload)

      case 'mismatch':
        throw new IntegrationError('Cache schema mismatch.', 'CACHE_SCHEMA_MISMATCH', 400)

      case 'no_match':
      case 'properties_missing': {
        const hubspotSchemaDiff = await this.compareSchemaToHubspot(schema)

        switch (hubspotSchemaDiff.match) {
          case 'full_match': {
            const fullyQualifiedName = hubspotSchemaDiff?.fullyQualifiedName as string
            const name = hubspotSchemaDiff?.name as string
            await this.saveSchemaToCache(fullyQualifiedName, name, schema)
            return await this.sendEvent(fullyQualifiedName, payload)
          }

          case 'mismatch':
            throw new IntegrationError('Hubspot schema mismatch.', 'HUBSPOT_SCHEMA_MISMATCH', 400)

          case 'no_match': {
            if (this.syncMode === 'update') {
              throw new IntegrationError(
                `The 'Sync Mode' setting is set to 'update' which is stopping Segment from creating a new Custom Event Schema in the HubSpot`,
                'HUBSPOT_SCHEMA_MISSING',
                400
              )
            }

            const schemaDiff = await this.createHubspotSchema(schema)
            const fullyQualifiedName = schemaDiff?.fullyQualifiedName as string
            const name = schemaDiff?.name as string
            await this.saveSchemaToCache(fullyQualifiedName, name, schema)
            return await this.sendEvent(fullyQualifiedName, payload)
          }

          case 'properties_missing': {
            if (this.syncMode === 'add') {
              throw new IntegrationError(
                `The 'Sync Mode' setting is set to 'add' which is stopping Segment from creating a new properties on the Event Schema in the HubSpot`,
                'HUBSPOT_SCHEMA_PROPERTIES_MISSING',
                400
              )
            }

            const fullyQualifiedName = hubspotSchemaDiff?.fullyQualifiedName as string
            const name = hubspotSchemaDiff?.name as string
            await this.updateHubspotSchema(fullyQualifiedName, hubspotSchemaDiff)
            await this.saveSchemaToCache(fullyQualifiedName, name, schema)
            return await this.sendEvent(fullyQualifiedName, payload)
          }
        }
      }
    }
  }

  async createHubspotSchema(schema: SegmentEventSchema): Promise<SchemaDiff> {
    interface RequestJSON {
      label: string
      name: string
      description: string
      primaryObject: string
      propertyDefinitions: Array<PropertyRequestJSON>
    }

    interface ResponseError {
      response: {
        data: {
          message: string
          status: string
          category: string
        }
      }
    }

    interface ResponseType {
      data: {
        fullyQualifiedName: string
        name: string
      }
    }

    const json: RequestJSON = {
      label: schema.eventName,
      name: schema.eventName,
      description: `${schema.eventName} - (created by Segment)`,
      primaryObject: schema.primaryObject,
      propertyDefinitions: Object.entries(schema.properties).map(([name, { type, stringFormat }]) => {
        return this.propertyBody(schema.eventName, type, name, stringFormat)
      })
    }

    try {
      const response: ResponseType = await this.request(`${HUBSPOT_BASE_URL}/events/v3/event-definitions`, {
        method: 'POST',
        json
      })

      return {
        match: 'full_match',
        fullyQualifiedName: response.data.fullyQualifiedName,
        name: response.data.name
      } as SchemaDiff
    } catch (error) {
      const responseError = error as ResponseError
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

  async updateHubspotSchema(fullyQualifiedName: string, schemaDiff: SchemaDiff) {
    interface RegectedResponse {
      data: {
        status: string
        message?: string
        propertiesErrorCode?: string
      }
    }

    interface ErrorResponse {
      code: string
    }

    const requests: Promise<{}>[] = []

    try {
      Object.keys(schemaDiff.missingProperties).forEach((propName) => {
        const { type, stringFormat } = schemaDiff.missingProperties[propName]
        const json = this.propertyBody(schemaDiff?.fullyQualifiedName as string, type, propName, stringFormat)
        const url = `${HUBSPOT_BASE_URL}/events/v3/event-definitions/${fullyQualifiedName}/property`
        requests.push(
          this.request(url, {
            method: 'POST',
            json
          })
        )
      })

      const responses = await Promise.allSettled(requests)

      for (const response of responses) {
        if (response.status === 'rejected') {
          const error = response.reason as RegectedResponse
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
      throw new IntegrationError(
        `Error updating schema in HubSpot. ${responseError.code}`,
        `${responseError.code}`,
        400
      )
    }
  }
}
