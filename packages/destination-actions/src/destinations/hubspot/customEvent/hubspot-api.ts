import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'

export type SyncMode = 'upsert' | 'add' | 'update'

type SegmentPropertyTypes = 'number' | 'object' | 'boolean' | 'string'
type HubspotPropertyTypes = 'string' | 'number' | 'enumeration'
type StringFormat = 'date' | 'datetime' | 'string'

interface SegmentProperty {
  type: SegmentPropertyTypes
  stringFormat?: StringFormat
}

interface SegmentEventSchema {
  eventName: string
  properties: {
    [key: string]: SegmentProperty
  }
}

interface SegmentEventSchemaWithFQN extends SegmentEventSchema {
  fullyQualifiedName: string,
  name: string
}

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

export class HubspotClient {
  request: RequestClient
  syncMode: SyncMode
  payloads: Payload[]
  objectType: string

  constructor(request: RequestClient, syncMode: SyncMode, payloads: Payload[]) {
    this.request = request
    this.syncMode = syncMode
    this.payloads = payloads
    this.objectType = payloads[0].record_details.object_type
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

  segmentSchemas(): SegmentEventSchema[] {
    const schemas: SegmentEventSchema[] = []

    this.payloads.forEach((payload) => {
      const { event_name, properties } = payload
      const sanitizedEventName = this.sanitizedEventName(event_name)

      let schema = schemas.find((s) => s.eventName === sanitizedEventName) 
      if(schema === undefined) {
        schema = { eventName: sanitizedEventName, properties: {} }
        schemas.push(schema)
      }

      if (properties) {
        Object.entries(properties).forEach(([property, value]) => {
          if(value!==null) {            
            schema.properties[property] = { 
              type: typeof value as SegmentPropertyTypes, 
              stringFormat: typeof value === 'string' ? this.stringFormat(value) : undefined
            }
          }
        })
      }
    })
    return schemas
  }

  async hubspotSchemas(): Promise<HubspotEventSchema[]> {
    interface ResponseType {
      data: {
        results: ResultItem[]
      }
    }

    const response: ResponseType = await this.request(
      `${HUBSPOT_BASE_URL}/events/v3/event-definitions/?includeProperties=true`,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )

    const segmentSchemas = this.segmentSchemas()
    const hubspotSchemas: HubspotEventSchema[] = []

    response.data.results.forEach((result: ResultItem) => {
      const { fullyQualifiedName, name } = result
      const segmentSchema = segmentSchemas.find((schema) => schema.eventName === fullyQualifiedName || schema.eventName === name)
      
      if(segmentSchema) {
        const hubspotSchema: HubspotEventSchema = {
          eventName: segmentSchema.eventName,
          fullyQualifiedName: result.fullyQualifiedName,
          name: result.name,
          properties: result.properties.reduce<{[key: string]:HubspotProperty}>((acc, prop) => {
            acc[prop.name] = {
              type: prop.type as HubspotPropertyTypes
            };
            return acc
          }, {})
        }

        hubspotSchemas.push(hubspotSchema)
      }
    })

    return hubspotSchemas
  }

  async schemasToCreateOrUpdate(): Promise<{ schemasToCreate: SegmentEventSchema[], schemasToUpdate: SegmentEventSchemaWithFQN[] }> {
    const hubspotSchemas = await this.hubspotSchemas()
    const segmentSchemas = this.segmentSchemas()
    const schemasToCreate: SegmentEventSchema[] = []
    const schemasToUpdate: SegmentEventSchemaWithFQN[] = []
  
    segmentSchemas.forEach((segmentSchema) => {
      const hubspotSchema = hubspotSchemas.find((schema) => schema.eventName === segmentSchema.eventName)
  
      if (!hubspotSchema) {
        // schema doesn't exist in Hubspot, so we'll create it
        schemasToCreate.push(segmentSchema)
      } else {
        // schema does exist in Hubspot, so figure out if any props need to be created
        const propertiesToCreate = Object.entries(segmentSchema.properties).filter(([name]) => {
          return !hubspotSchema.properties[name]
        })
        
        if(propertiesToCreate.length > 0) {
          const schemaToUpdate: SegmentEventSchemaWithFQN = {
            ...segmentSchema,
            fullyQualifiedName: hubspotSchema.fullyQualifiedName,
            name: hubspotSchema.name
          }
          schemasToUpdate.push(schemaToUpdate)
        }
      }
    })

    return { schemasToCreate, schemasToUpdate }
  }
  
  async createEventSchemas(schemasToCreate: SegmentEventSchema[]) {
    interface HSCustomEventSchema {
      label: string;
      name: string;
      description: string;
      primaryObject: string;
      propertyDefinitions: Array<{
        name: string;
        label: string;
        type: string;
        description: string;
        options?: Array<{
          label: string;
          value: boolean;
          description: string;
          hidden: boolean;
          displayOrder: number;
        }>
      }>
    }
  
    const requests = schemasToCreate.map(async (schema) => {
      const json: HSCustomEventSchema = {
        label: schema.eventName,
        name: schema.eventName,
        description: `${schema.eventName} - (created by Segment)`,
        primaryObject: this.objectType,
        propertyDefinitions: Object.entries(schema.properties).map(([name, { type, stringFormat }]) => {
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
                  throw new PayloadValidationError(`Property ${name} in event ${schema.eventName} has an unsupported type: ${type}`);
              }
            default:
              throw new PayloadValidationError(`Property ${name} in event ${schema.eventName} has an unsupported type: ${type}`);
          }
        })
      };
  
      return this.request(`${HUBSPOT_BASE_URL}/events/v3/event-definitions`, {
        method: 'POST',
        json
      })
    })

    await Promise.all(requests)
  }

  

  async updateEventSchemas(schemasToUpdate: SegmentEventSchemaWithFQN[]) {
    interface HSCustomProperty {
          name: string,
          label: string,
          type: HubspotPropertyTypes,
          description: string
    }
    
    const requests = schemasToUpdate.map(async (schema) => {
      
      Object.entries(schema.properties).forEach(([name, { type, stringFormat }]) => {
        
        const json: HSCustomProperty = {
          name: name,
          label: name,
          type: type === 'string' ? stringFormat : type,
          description: `${name} - (created by Segment)`
        }

        return this.request(`${HUBSPOT_BASE_URL}/events/v3/event-definitions/${schema.fullyQualifiedName}/properties`, {
          method: 'POST',
          json
        })

      }

    })
     
  }
}
