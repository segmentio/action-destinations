import { RequestClient} from '@segment/actions-core'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'

export type SyncMode = 'upsert' | 'add' | 'update'


interface EventSchemas {
  [eventName: string]: {
      [property: string]: string;
  };
}

export class HubspotClient {
  request: RequestClient
  syncMode: SyncMode
  payloads: Payload[]

  constructor(
    request: RequestClient,
    syncMode: SyncMode,
    payloads: Payload[]
  ) {
    this.request = request
    this.syncMode = syncMode
    this.payloads = payloads
  }
  
  eventSchemas(): EventSchemas {
    const schemas: EventSchemas = {}

    this.payloads.forEach(payload => {
        const { event_name, properties } = payload

        if (!schemas[event_name]) {
          schemas[event_name] = {}
        }

        if (properties) {
            Object.entries(properties).forEach(([property, value]) => {
              schemas[event_name][property] = typeof value
            })
        }
    })
    return schemas
  }

  eventNames(): string[] {
    return Object.keys(this.eventSchemas())
  }

  async hsEventSchemas() : Promise<EventSchemas> {
    
    interface ResponseType {
      data: {
        results: ResultItem[]
      }
    }
  
    interface ResultItem {
      labels: {
        singular: string | null,
        plural: string | null
      },
      archived: boolean,
      fullyQualifiedName: string,
      properties: Array<
        {
          archived: boolean,
          label: string,
          name: string,
          type: string,
          displayOrder: number
        }>
    }

    const response: ResponseType = await this.request(`${HUBSPOT_BASE_URL}/events/v3/event-definitions/?includeProperties=true`, {
      method: 'GET',
      skipResponseCloning: true
    })
    
    const schemas: EventSchemas = {}

    const eventNames = this.eventNames()

    response.data.results
      .filter(result => eventNames.includes(result.fullyQualifiedName))
      .forEach((result: ResultItem) => {
        const eventName = result.fullyQualifiedName
        
        if (!schemas[eventName]) {
          schemas[eventName] = {}
        }

        result.properties.forEach((property) => {
          if (!property.archived) {
            schemas[eventName][property.name] = property.type
          }
        })
      })

    return schemas
  }

  async eventSchemasToCreate() : Promise<EventSchemas> {
    const existingSchemas = await this.hsEventSchemas()
    const schemasToCreate: EventSchemas = {}

    this.eventNames().forEach(eventName => {
      if (!existingSchemas[eventName]) {
        schemasToCreate[eventName] = this.eventSchemas()[eventName]
      } else {
        const existingProperties = existingSchemas[eventName]
        const newProperties = this.eventSchemas()[eventName]

        Object.entries(newProperties).forEach(([property, type]) => {
          if (!existingProperties[property]) {
            if (!schemasToCreate[eventName]) {
              schemasToCreate[eventName] = {}
            }
            schemasToCreate[eventName][property] = type
          }
        })
      }
    })

    return schemasToCreate
  }
}
