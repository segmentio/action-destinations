import { RequestClient, PayloadValidationError, IntegrationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { RetryableError } from '@segment/actions-core/*'


export type SyncMode = 'upsert' | 'add' | 'update'

type StringFormat = 'date' | 'datetime' | 'string'

type SegmentPropertyTypes = 'number' | 'object' | 'boolean' | 'string'
interface SegmentProperty {
  type: SegmentPropertyTypes
  stringFormat?: StringFormat
}

type SchemaMatch = 'full_match' | 'properties_missing' | 'no_match' | 'mismatch'

interface SchemaDiff {
  match: SchemaMatch,
  fullyQualifiedName?: string,
  name?: string,
  missingProperties?: {
    [key: string]: SegmentProperty
  }
}

interface SegmentEventSchema {
  eventName: string
  properties: {
    [key: string]: SegmentProperty
  },
  primaryObject: string
}

interface SegmentEventSchemaWithFQN {
  fullyQualifiedName: string,
  name: string,
  eventName: string
  properties: {
    [key: string]: SegmentProperty
  }
}

interface PropertyRequestJSON {
  name: string
  label: string
  type: HubspotPropertyTypes
  description: string
  options?: Array<{
    label: string
    value: boolean
    description: string
    hidden: boolean
    displayOrder: number
  }>
}

type HubspotPropertyTypes = 'string' | 'number' | 'enumeration' | 'datetime'

interface HubspotProperty {
  type: HubspotPropertyTypes
}

interface HubspotEventSchema {
  eventName: string
  properties: {
    [key: string]: HubspotProperty
  }
  fullyQualifiedName: string
  name: string
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

  sanitizedEventName(eventName: string): string {
    return eventName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  }

  sanitizeProperties(properties: {[k: string]: unknown}): {[k: string]: string | number | boolean} {
    const result: {[k: string]: string | number | boolean} = {}
  
    Object.keys(properties).forEach((key) => {
      const value = properties[key];
      result[key] = (typeof value === 'object' && value !== null)
        ? JSON.stringify(value)
        : value as string | number | boolean;
    })
  
    return result
  }

  propertyBody(eventName: string, type: SegmentPropertyTypes, name: string, stringFormat?: StringFormat): PropertyRequestJSON {
    switch (type) {
      case 'number':
        return {
          name: name,
          label: name,
          type: 'number',
          description: `${name} - (created by Segment)`
        };
      case 'object':
        return {
          name: name,
          label: name,
          type: 'string',
          description: `${name} - (created by Segment)`
        };
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
        };
      case 'string':
        switch (stringFormat as StringFormat) {
          case 'string':
            return {
              name: name,
              label: name,
              type: 'string',
              description: `${name} - (created by Segment)`,
            };
          case 'date':
          case 'datetime':
            return {
              name: name,
              label: name,
              type: 'datetime',
              description: `${name} - (created by Segment)`,
            };
          case undefined:
          default:
            throw new PayloadValidationError(`Property ${name} in event ${eventName} has an unsupported type: ${type}`);
        }
      default:
        throw new PayloadValidationError(`Property ${name} in event ${eventName} has an unsupported type: ${type}`);
    }
  }

  segmentSchema(payload: Payload): SegmentEventSchema {
    const { event_name, properties } = payload
    const sanitizedEventName = this.sanitizedEventName(event_name)
    const props: { [key: string]: SegmentProperty } = {}

    if(properties){
      Object.entries(properties).forEach(([property, value]) => {
        if(value!==null) {            
          props[property] = { 
            type: typeof value as SegmentPropertyTypes, 
            stringFormat: typeof value === 'string' ? this.stringFormat(value) : undefined
          }
        }
      })
    }
    return { eventName: sanitizedEventName, primaryObject: payload.record_details.object_type, properties: props }   
  }

  async compareSchemaToCache(schema: SegmentEventSchema): Promise<SchemaDiff> {
    // code to fetch from hubspot and compare schema
    
    const schemaDiff: SchemaDiff = {
      match: 'no_match'
    }

    return Promise.resolve(schemaDiff)
  }

  async compareSchemaToHubspot(schema: SegmentEventSchema): Promise<SchemaDiff> {
    
    interface ResponseType {
      data: ResultItem
    }

    interface ResultItem {
      labels: {
        singular: string | null
        plural: string | null
      }
      archived: boolean
      fullyQualifiedName: string
      name: string
      properties: Array<{
        archived: boolean
        label: string
        name: string
        type: string
        displayOrder: number
      }>
    }

    try{
      const url = `${HUBSPOT_BASE_URL}/events/v3/event-definitions/${schema.eventName}/?includeProperties=true`
      const response: ResponseType = await this.request(
        url,
        {
          method: 'GET',
          skipResponseCloning: true
        }
      )

      const { fullyQualifiedName, name, properties, archived } = response.data
      
      if(archived){
        return {
          match: 'mismatch'
        } as SchemaDiff
      }

      const missingProperties = properties.reduce<{[key: string]:HubspotProperty}>((acc, prop) => {
        acc[prop.name] = {
          type: prop.type as HubspotPropertyTypes
        };
        return acc
      }, {})

      return {
        match: Object.keys(missingProperties).length === 0 ? 'full_match' : 'properties_missing',
        fullyQualifiedName,
        name,
        missingProperties
      } as SchemaDiff

    } 
    catch {
      return {
        match: 'no_match'
      } as SchemaDiff
    }
  }

  async saveSchemaToCache(fullyQualifiedName: string, name: string, schema: SegmentEventSchema) {
    console.log(`saved schema to cache: ${fullyQualifiedName} ${name} ${JSON.stringify(schema)}`)
    return 
  }

  async sendEvent(fullyQualifiedName: string, payload: Payload) {
    const { record_details, properties, occurred_at: occurredAt } = payload
    const eventName = fullyQualifiedName
    const url = `${HUBSPOT_BASE_URL}/events/v3/send`
    
    const json = {
      eventName,
      objectId: record_details.record_id_value,
      occurredAt,
      properties: properties ? this.sanitizeProperties(properties) : undefined
    }

    await this.request(url, {
      method: 'POST',
      json
    })
  }

  async send(payload: Payload) {
    const schema = this.segmentSchema(payload)
    const cacheSchemaDiff = await this.compareSchemaToCache(schema)

    switch(cacheSchemaDiff.match){

      case 'full_match':
        await this.sendEvent(cacheSchemaDiff.fullyQualifiedName, payload) 
        break

      case 'mismatch':
        throw new IntegrationError("Some sort of mismatch error happened. Unable to recover.", "CACHE_SCHEMA_MISMATCH", 400)

      case 'no_match':
      case 'properties_missing':
        const hubspotSchemaDiff = await this.compareSchemaToHubspot(schema) 
        switch(hubspotSchemaDiff.match){
          case 'full_match':
            await this.saveSchemaToCache(hubspotSchemaDiff.fullyQualifiedName, hubspotSchemaDiff.name, schema)
            await this.sendEvent(cacheSchemaDiff.fullyQualifiedName, payload) 
            break
          case 'mismatch':
            throw new IntegrationError("Some sort of mismatch error happened. Unable to recover.", "HUBSPOT_SCHEMA_MISMATCH", 400)
          case 'no_match':
            const newHubstpoSchema = await this.createHubspotSchema(schema)
            await this.saveSchemaToCache(newHubstpoSchema.fullyQualifiedName, newHubstpoSchema.name, schema)
            await this.sendEvent(cacheSchemaDiff.fullyQualifiedName, payload) 
            break
          case 'properties_missing':
            await this.updateHubspotSchema(hubspotSchemaDiff.fullyQualifiedName, hubspotSchemaDiff.name, hubspotSchemaDiff.missingProperties)
            await this.saveSchemaToCache(hubspotSchemaDiff.fullyQualifiedName, hubspotSchemaDiff.name, hubspotSchemaDiff.missingProperties)
            await this.sendEvent(cacheSchemaDiff.fullyQualifiedName, payload) 
            break
        }
        break
    }
  }





  async hubspotSchema(payload: Payload): Promise<HubspotEventSchema | undefined> {
    interface ResponseType {
      data: ResultItem
    }

    interface ResultItem {
      labels: {
        singular: string | null
        plural: string | null
      }
      archived: boolean
      fullyQualifiedName: string
      name: string
      properties: Array<{
        archived: boolean
        label: string
        name: string
        type: string
        displayOrder: number
      }>
    }

    const eventName = this.sanitizedEventName(payload.event_name)

    try{
      const url = `${HUBSPOT_BASE_URL}/events/v3/event-definitions/${eventName}/?includeProperties=true`
      console.log(url)
      const response: ResponseType = await this.request(
        url,
        {
          method: 'GET',
          skipResponseCloning: true
        }
      )

      const segmentSchema = this.segmentSchema(payload)
      const { fullyQualifiedName, name, properties } = response.data
      const hubspotSchema: HubspotEventSchema = {
        eventName: segmentSchema.eventName,
        fullyQualifiedName,
        name,
        properties: properties.reduce<{[key: string]:HubspotProperty}>((acc, prop) => {
          acc[prop.name] = {
            type: prop.type as HubspotPropertyTypes
          };
          return acc
        }, {})
      }
      return hubspotSchema
    } 
    catch {
      // We only need to know if the schema exists or not, so if it doesn't, we'll just return undefined
      return undefined
    }
  }

  // async ensureSchema(payload: Payload): Promise<boolean> {
  //   const segmentSchema = this.segmentSchema(payload)
  //   const hubspotSchema = await this.hubspotSchema(payload)

  //   if (hubspotSchema === undefined) {
      
  //     await this.createSchema(segmentSchema)
  //     return true
    
  //   } else {
      
  //     const propertiesToCreate = Object.entries(segmentSchema.properties)
  //       .filter(([name]) => {
  //         return !hubspotSchema.properties[name]
  //       })
  //       .reduce<{[key: string]: SegmentProperty}>((acc, [name, value]) => {
  //         acc[name] = value
  //         return acc
  //       }, {})

  //     if(Object.keys(propertiesToCreate).length > 0) {
  //       const schemaToUpdate: SegmentEventSchemaWithFQN = {
  //         eventName: segmentSchema.eventName,
  //         properties: propertiesToCreate,
  //         fullyQualifiedName: hubspotSchema.fullyQualifiedName,
  //         name: hubspotSchema.name
  //       }
  //       await this.updateSchema(schemaToUpdate)
  //       return true

  //     } else {
  //       return true
  //     }
  //   }
  // }

  async createSchema(schema: SegmentEventSchema) {
    interface HSCustomEventSchema {
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

    const json: HSCustomEventSchema = {
      label: schema.eventName,
      name: schema.eventName,
      description: `${schema.eventName} - (created by Segment)`,
      primaryObject: schema.primaryObject,
      propertyDefinitions: Object.entries(schema.properties).map(([name, { type, stringFormat }]) => {
        return this.propertyBody(schema.eventName, type, name, stringFormat)
      })
    }

    try {
      await this.request(`${HUBSPOT_BASE_URL}/events/v3/event-definitions`, {
        method: 'POST',
        json
      })
    } catch (error){
      const responseError = error as ResponseError
      if(responseError.response.data.category === 'OBJECT_ALREADY_EXISTS') {
        throw new RetryableError()
      }
      throw new IntegrationError(
        `Error creating schema in HubSpot. ${responseError.response.data.message}`,
        'HUBSPOT_CREATE_SCHEMA_ERROR',
        400
      )
    }
  }

  async updateSchema(schema: SegmentEventSchemaWithFQN) {
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
      Object.keys(schema.properties).forEach(propName => {
        const property = schema.properties[propName]
        const { type, stringFormat } = property
        const json = this.propertyBody(schema.eventName, type, propName, stringFormat)
        const url = `${HUBSPOT_BASE_URL}/events/v3/event-definitions/${schema.fullyQualifiedName}/property`
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

  // async sendEvent(payload: Payload) {
  //   const { event_name, record_details, properties, occurred_at: occurredAt } = payload
  //   const eventName = this.sanitizedEventName(event_name)
  //   const url = `${HUBSPOT_BASE_URL}/events/v3/send`
    
  //   const json = {
  //     eventName,
  //     objectId: record_details.record_id_value,
  //     occurredAt,
  //     properties: properties ? this.sanitizeProperties(properties) : undefined
  //   }

  //   console.log(json)

  //   await this.request(url, {
  //     method: 'POST',
  //     json
  //   })
  // }
}
