import { RequestClient } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { PayloadValidationError } from '@segment/actions-core/*'

export type SyncMode = 'upsert' | 'add' | 'update'

interface EventSchemas {
  [eventName: string]: {
    [property: string]: {
      type: string,
      format?: string
    }
  }
}

type HubspotStringType = 'date' | 'datetime' | 'string'

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

  eventSchemas(): EventSchemas {
    const schemas: EventSchemas = {}

    this.payloads.forEach((payload) => {
      const { event_name, properties } = payload

      if (!schemas[event_name]) {
        schemas[event_name] = {}
      }

      if (properties) {
        Object.entries(properties).forEach(([property, value]) => {
          schemas[event_name][property] = { type: typeof value, format: typeof value === 'string' ? this.hubspotStringType(value) : undefined }
        })
      }
    })
    return schemas
  }

  eventNames(): string[] {
    return Object.keys(this.eventSchemas())
  }

  async hsEventSchemas(): Promise<EventSchemas> {
    interface ResponseType {
      data: {
        results: ResultItem[]
      }
    }

    interface ResultItem {
      labels: {
        singular: string | null
        plural: string | null
      }
      archived: boolean
      fullyQualifiedName: string
      properties: Array<{
        archived: boolean
        label: string
        name: string
        type: string
        displayOrder: number
      }>
    }

    const response: ResponseType = await this.request(
      `${HUBSPOT_BASE_URL}/events/v3/event-definitions/?includeProperties=true`,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )

    const schemas: EventSchemas = {}

    const eventNames = this.eventNames()

    response.data.results
      .filter((result) => eventNames.includes(result.fullyQualifiedName))
      .forEach((result: ResultItem) => {
        const eventName = result.fullyQualifiedName

        if (!schemas[eventName]) {
          schemas[eventName] = {}
        }

        result.properties.forEach((property) => {
          if (!property.archived) {
            schemas[eventName][property.name] = { type: property.type, format: undefined }
          }
        })
      })

    return schemas
  }

  async eventSchemasToCreate(): Promise<{ schemasToCreate: EventSchemas, schemasToUpdate: EventSchemas }> {
    const hsEventSchemas = await this.hsEventSchemas()
    const eventSchemas = this.eventSchemas()
    const schemasToCreate: EventSchemas = {}
    const schemasToUpdate: EventSchemas = {}
  
    Object.keys(eventSchemas).forEach((eventName) => {
      if (!hsEventSchemas[eventName]) {
        schemasToCreate[eventName] = JSON.parse(JSON.stringify(eventSchemas[eventName]))
      } else {
        Object.entries(eventSchemas[eventName]).forEach(([property, type]) => {
          if (!hsEventSchemas[eventName][property]) {
            if (!schemasToUpdate[eventName]) {
              schemasToUpdate[eventName] = {};
            }
            schemasToUpdate[eventName][property] = type
          }
        });
      }
    });
  
    return { schemasToCreate, schemasToUpdate }
  }
  
  hubspotStringType(str: string): HubspotStringType {
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

  async createEventSchemas(schemasToCreate: EventSchemas): Promise<void> {
    
    interface HSCustomEventSchama {
      label: string,
      name: string,
      description: string, 
      primaryObject: string,
      propertyDefinitions: Array<{
        name: string,
        label: string,
        type: string,
        description: string,
        options?: Array<{
          label: string,
          value: string | number,
          description: string,
          hidden: boolean,
          displayOrder: number
        }>
      }>
    }
    
    const requests = []
    
    for (const [eventName, properties] of Object.entries(schemasToCreate)) {
      const json: HSCustomEventSchama = {
        label: eventName,
        name: eventName,
        description: `${eventName} - (created by Segment)`,
        primaryObject: this.objectType,
        propertyDefinitions: Object.entries(properties)
        .map(([name, { type, format }]) => {
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
                    value: 'true',
                    hidden: false,
                    description: 'True',
                    displayOrder: 1
                  },
                  {
                    label: 'false',
                    value: 'false',
                    hidden: false,
                    description: 'False',
                    displayOrder: 2
                  }
                ]
              }
            case 'string':
              switch (format as string) {
                case 'string':
                  return {
                    name: name,
                    label: name,
                    type: 'string',
                    description: `${name} - (created by Segment)`,
                  }
                case 'date':
                  return {
                    name: name,
                    label: name,
                    type: 'date',
                    description: `${name} - (created by Segment)`,
                  }
                case 'datetime':
                  return {
                    name: name,
                    label: name,
                    type: 'datetime',
                    description: `${name} - (created by Segment)`,
                  }
              }
          }
        })
      }

      requests.push(await this.request(`${HUBSPOT_BASE_URL}/events/v3/event-definitions`, {
        method: 'POST',
        json
      }))
      
      const responses = await Promise.all(requests)

      console.log(responses)

    }
  }
}
