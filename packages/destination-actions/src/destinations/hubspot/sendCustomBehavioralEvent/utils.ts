import { StateContext, RequestClient, RetryableError } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core/*'
import snakeCase from 'lodash/snakeCase'
import type { Payload } from './generated-types'

const defaultProperties = [
    `hs_asset_description`,
    `hs_asset_type`,
    `hs_browser`,
   `hs_campaign_id`,
    `hs_city`,
    `hs_country`,
    `hs_device_name`,
    `hs_device_type`,
    `hs_element_class`,
    `hs_element_id`,
    `hs_element_text`,
    `hs_language`,
    `hs_link_href`,
    `hs_operating_system`,
    `hs_operating_version`,
    `hs_page_content_type`,
    `hs_page_id`,
    `hs_page_title`,
    `hs_page_url`,
    `hs_parent_module_id`,
    `hs_referrer`,
    `hs_region`,
    `hs_screen_height`,
    `hs_screen_width`,
    `hs_touchpoint_source`,
    `hs_tracking_name`,
    `hs_user_agent`,
    `hs_utm_campaign`,
    `hs_utm_content`,
    `hs_utm_medium`,
    `hs_utm_source`,
    `hs_utm_term`
]

type JSONObject = { [key: string]: unknown } | undefined

interface CustomEvent {
    eventName: string
    occurredAt?: string | number
    properties?: { [key: string]: unknown }
    utk?: string
    email?: string
    objectId?: string
}

interface Options {
    label: string,
    value: string
}

interface PropertyDefinition {
    name: string,
    label?: string,
    type: 'number' | 'string' | 'enumeration' | 'datetime'
    options?: Options[],
    description?: string
}

export interface EventSchema {
    fullyQualifiedName: string,
    name: string,
    properties: PropertyDefinition[]
}

interface EventDefinitionSearchResponse {
    results: EventSchema[]
}

export class HubspotEventClient {
    request: RequestClient
    stateContext: StateContext

    constructor(request: RequestClient, stateContext: StateContext) {
        this.request = request,
        this.stateContext = stateContext
    }

    getSchemaFromCache(eventName: string): EventSchema | undefined {
        const cachedValue = this.stateContext?.getRequestContext?.(eventName) ?? undefined 
        return cachedValue ? JSON.parse(cachedValue) : undefined
    }

    addSchemaToCache(eventSchema: EventSchema) {
        this.stateContext?.setResponseContext?.(`events`, JSON.stringify(eventSchema), {})
    }

    async getSchemaFromHubspot(eventName: string): Promise<EventSchema | undefined> {
        
        // TODO - might need to remove _ from eventName before carrying out the search
        const endpoint = `https://api.hubspot.com/events/v3/event-definitions/?searchString=${eventName}&includeProperties=true`
        
        const response = await this.request<EventDefinitionSearchResponse>(endpoint, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            }
        })

        const results: EventSchema[] = response.data.results
        return results.find((result: EventSchema) => result.fullyQualifiedName === eventName)
    }

    isPropertyInSchema(property: { name: string; type: string }, definitions: PropertyDefinition[]): boolean {
        const match = definitions.find((defintion: PropertyDefinition) => {
            return defintion.name === property.name && defintion.type === property.type
        })
        return match !== undefined
    }

    findMissingPropertiesInSchema(properties: {name: string; type: string }[], definitions: PropertyDefinition[]): {name: string; type: string }[] {
        return properties.filter((property) => !this.isPropertyInSchema(property, definitions))
    }

    async addPropertyToHubspotSchema(property: {name: string; type: string }, eventName: string){
        const endpoint = `https://api.hubspot.com/events/v3/event-definitions/${eventName}/property`
        const response = await this.request(endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            json: {
                name: snakeCase(property.name),
                label: property.name,
                type: property.type,
                description: `Property ${property.name} Added by Segment`
            } as PropertyDefinition
        })
        return response
    }

    async createSchemaInHubspot(properties: {name: string; type: string }[], eventName: string): Promise<EventSchema>{
        const endpoint = `https://api.hubspot.com/events/v3/event-definitions`
        const response = await this.request(endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            json: {
                label: eventName,
                name: eventName,
                description: `Event ${eventName} Added by Segment`,
                primaryObject: 'CONTACT',
                propertyDefinitions: properties.map((property) => {
                    return {
                        name: snakeCase(property.name),
                        label: property.name,
                        type: property.type,
                        description: `Property ${property.name} Added by Segment`
                    }
                })
            }
        })

        return await response.json()
    }

    async ensureHubspotSchema(properties: {name: string; type: string }[], eventName: string): Promise<EventSchema> {
        let eventSchema = await this.getSchemaFromHubspot(eventName)
        
        if(!eventSchema){
            eventSchema = await this.createSchemaInHubspot(properties, eventName)
            if(!eventSchema){
                throw new IntegrationError(`Failed to create Hubspot schema for event ${eventName}`, 'HUBSPOT_SCHEMA_CREATION_FAILED', 400)   
            }
            this.addSchemaToCache(eventSchema)
        } else {
            const missingProperties = this.findMissingPropertiesInSchema(properties, eventSchema.properties)
            const promises = missingProperties.map((property) => {
                return this.addPropertyToHubspotSchema(property, eventName);
            })
            await Promise.all(promises)
            eventSchema = await this.getSchemaFromHubspot(eventName)
            if(!eventSchema){
                throw new IntegrationError(`Failed to update Hubspot schema for event ${eventName}`, 'HUBSPOT_SCHEMA_UPDATE_FAILED', 400)    
            } 
            const remainingMissingProperties = this.findMissingPropertiesInSchema(properties, eventSchema.properties)
            if(remainingMissingProperties.length > 0){
                throw new RetryableError(`Retrying: Failed to properly create properties in Hubspot schema for event ${eventName}`)
            }
            this.addSchemaToCache(eventSchema)
        }

        if(this.findMissingPropertiesInSchema(properties, eventSchema.properties).length>0){
            throw new IntegrationError(`Failed to update Hubspot schema for event ${eventName}`, 'HUBSPOT_SCHEMA_UPDATE_FAILED', 400)  
        }

        return eventSchema
    }  
    
    async sendCustomEvent(payload: Payload){
        const endpoint = `https://api.hubspot.com/events/v3/send`
        await this.request(endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            json: {
                eventName: payload.eventName,
                occurredAt: payload.occurredAt,
                utk: payload.utk,
                email: payload.email,
                objectId: payload.objectId,
                properties: this.flattenObject(payload.properties)
            } as CustomEvent
        })
    }

    flattenObject(obj: JSONObject) {
        if (typeof obj === 'undefined' || obj === null) return obj
        const flattened: JSONObject = {}
        Object.keys(obj).forEach((key: string) => {
          // Skip if the value is null or undefined or not own property
          if (typeof obj[key] === 'undefined' || obj[key] == null || !Object.prototype.hasOwnProperty.call(obj, key)) {
            return
          }
          // Flatten if item is an array
          if (obj[key] instanceof Array) {
            flattened[key] = (obj[key] as Array<unknown>)
              .map((item: unknown) => (typeof item === 'object' ? JSON.stringify(item) : item))
              .join(';')
            return
          }
          // Flatten if item is an object
          if (typeof obj[key] === 'object') {
            flattened[key] = JSON.stringify(obj[key])
            return
          }
          flattened[key] = obj[key]
        })
        return flattened
    }
}