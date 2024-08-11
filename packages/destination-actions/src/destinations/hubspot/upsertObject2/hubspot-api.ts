import { RequestClient, PayloadValidationError, IntegrationError, ModifiedResponse } from '@segment/actions-core'
import { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { MAX_HUBSPOT_BATCH_SIZE } from './constants'

const OBJECT_NOT_FOUND_ERROR_RESPONSE = 'Unable to infer object type'

export const SyncMode = {
  Upsert: 'upsert', 
  Add: 'add', 
  Update: 'update' 
} as const

export type SyncMode = (typeof SyncMode)[keyof typeof SyncMode]

export type AssociationSyncMode = 'upsert' | 'read'

export const BatchRequestType = { 
  Upsert: 'upsert', 
  Create: 'create', 
  Update: 'update',
  Read: 'read' 
} as const 

export type BatchRequestType = (typeof BatchRequestType)[keyof typeof BatchRequestType]

export const HSPropTypeFieldType = {
  StringText: 'string:text',
  NumberNumber: 'number:number',
  DateTimeDate: 'datetime:date',
  DateDate: 'date:date',
  EnumerationBooleanCheckbox: 'enumeration:booleancheckbox'
} as const

export type HSPropTypeFieldType = (typeof HSPropTypeFieldType)[keyof typeof HSPropTypeFieldType]

export const HSPropType = {
  Date: 'date',
  String: 'string',
  DateTime: 'datetime',
  Number: 'number',
  Enumeration: 'enumeration'
} as const

export type HSPropType = (typeof HSPropType)[keyof typeof HSPropType]

export const HSPropFieldType = {
  Text: 'text',
  Number: 'number',
  Date: 'date',
  BooleanCheckbox: 'booleancheckbox'
} as const

export type HSPropFieldType = (typeof HSPropFieldType)[keyof typeof HSPropFieldType]

export const SchemaMatch = { 
  FullMatch: 'full_match', 
  PropertiesMissing: 'properties_missing', 
  NoMatch: 'no_match', 
  Mismatch: 'mismatch' 
} as const

export type SchemaMatch = typeof SchemaMatch[keyof typeof SchemaMatch];

export interface Prop {
  name: string
  type: HSPropType
  fieldType: HSPropFieldType
  typeFieldType: HSPropTypeFieldType
}

export interface Schema {
  object_details: { 
    object_type: string
    id_field_name: string
  }
  properties: Prop[]
  sensitiveProperties: Prop[]
}

interface SchemaDiff {
  match: SchemaMatch
  object_details: { 
    object_type: string, 
    id_field_name: string
  },
  missingProperties: Prop[]
  missingSensitiveProperties: Prop[]
}

interface ResponseType {
  status: 'fulfilled' | 'rejected'
  value?: { data: { results: Result[] } }  
  reason?: { message: string }
}

interface Result {
  name: string
  type: HSPropType
  fieldType: HSPropFieldType
  hasUniqueValue: boolean
}

interface ReadJSON {
  idProperty: string
  properties: string[]
  inputs: Array<{ id: string }>
}

interface UpsertJSON {
  inputs: Array<{
    idProperty: string
    id: string
    properties: Record<string, string>
  }>
}
interface CreateJSON {
  inputs: Array<{
    idProperty: string
    properties: Record<string, string>
  }>
}

interface RespJSON {
  status: string
  results: Array<{
    id: string
    properties: Record<string, string | null>
  }>
}

export interface ExtendedPayload extends Payload {
  object_details: Payload['object_details'] & {
    /**
     * The record ID for the object.
     */
    record_id: string
  }
}

interface AssociationPayload {
  object_type: string
  association_label: string
  id_field_name: string
  id_field_value: string
}

export class HubspotClient {
  request: RequestClient
  objectType: string
  idFieldName: string
  syncMode: SyncMode
  associationSyncMode: AssociationSyncMode
  propertyGroup?: string

  constructor(
    request: RequestClient,
    objectType: string,
    idFieldName: string,
    syncMode: SyncMode,
    associationSyncMode: AssociationSyncMode,
    propertyGroup: string | undefined
  ) {
    this.request = request
    this.objectType = objectType
    this.idFieldName = idFieldName
    this.syncMode = syncMode
    this.associationSyncMode = associationSyncMode
    this.propertyGroup = propertyGroup
  }

  cleanProp(str: string): string {

    str = str.toLowerCase().replace(/[^a-z0-9_]/g, '_')

    if(!/^[a-z]/.test(str)) {
      throw new PayloadValidationError(`Property ${str} in event has an invalid name. Property names must start with a letter.`)
    }

    return str
  }

  cleanObj(obj: { [k: string]: unknown } | undefined): { [k: string]: string | number | boolean } | undefined {
    
    const cleanObj: { [k: string]: string | number | boolean } = {}
    
    if(obj === undefined){
      return undefined
    }
    
    Object.keys(obj).forEach((key) => {
        const value = obj[key]
        const cleanKey = this.cleanProp(key)
        cleanObj[cleanKey] = typeof value === 'object' && value !== null 
            ? JSON.stringify(value) 
            : (value as string | number | boolean)
    })

    return cleanObj
  }

  cleanProps(payloads: Payload[]): Payload[] {
    const copy = JSON.parse(JSON.stringify(payloads)) as Payload[]
    copy.forEach((payload) => {
      payload.properties = this.cleanObj(payload.properties)
      payload.sensitive_properties = this.cleanObj(payload.sensitive_properties)
    })
    return copy
  }

  format(value: unknown): { type: HSPropType, fieldType: HSPropFieldType} {
    switch (typeof value) {
      case 'object':
        return { type: HSPropType.String, fieldType: HSPropFieldType.Text }
      case 'number':
        return { type: HSPropType.Number, fieldType: HSPropFieldType.Number } 
      case 'boolean':
        return { type: HSPropType.Enumeration, fieldType: HSPropFieldType.BooleanCheckbox } 
      case 'string': {
        const date = new Date(value as string)

        if (isNaN(date.getTime())) {
          return { type: HSPropType.String, fieldType: HSPropFieldType.Text } 
        } else {

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
              return { type: HSPropType.Date, fieldType: HSPropFieldType.Date }
            }
          }
          return { type: HSPropType.DateTime, fieldType: HSPropFieldType.Date }
        }
      }
      case undefined: 
      default: 
        throw new IntegrationError('Property must be an object, boolean, string or number', 'HUBSPOT_PROPERTY_VALUE_UNDEFINED', 400)
    }
  }

  formatHS(type:HSPropType, fieldType: HSPropFieldType): HSPropTypeFieldType {
    if(type === 'date' && fieldType === 'date') {
      return HSPropTypeFieldType.DateDate
    } else if(type === 'string' && fieldType === 'text') {
      return HSPropTypeFieldType.StringText
    } else if(type === 'number' && fieldType === 'number') {
      return HSPropTypeFieldType.NumberNumber
    } else if (type === 'datetime' && fieldType === 'date') {
      return HSPropTypeFieldType.DateTimeDate
    } else if (type === 'enumeration' && fieldType === 'booleancheckbox') {
      return HSPropTypeFieldType.EnumerationBooleanCheckbox
    }
    throw new IntegrationError('Property type not supported', 'HUBSPOT_PROPERTY_TYPE_NOT_SUPPORTED', 400)
  }

  schema(payloads: Payload[]): Schema {
    const extractProperties = (propertyType: 'properties' | 'sensitive_properties'): Prop[] => {
      return Object.values(
        payloads.reduce((acc, payload) => {
          const properties = payload[propertyType];
          if (properties) {
            Object.entries(properties).forEach(([propName, value]) => {
              const typeData = this.format(value)
              acc[propName] = {
                name: propName,
                type: typeData.type,
                fieldType: typeData.fieldType,
                typeFieldType: this.formatHS(typeData.type, typeData.fieldType)
              };
            });
          }
          return acc
        }, {} as { [name: string]: Prop })
      )
    }
  
    const properties = extractProperties('properties')
    const sensitiveProperties = extractProperties('sensitive_properties')
    
    return {
      object_details: { 
        object_type: this.objectType,
        id_field_name: this.idFieldName
      },
      properties,
      sensitiveProperties
    }
  }

  async schemaDiffCache(schema: Schema): Promise<SchemaDiff> {

    // no op function until caching implemented
    let data = JSON.stringify(`${schema}`)
    data = data.replace(data, '')
    console.log(`compared schema to cache: ${data}`)

    const schemaDiff: SchemaDiff = {
      match: 'no_match',
      object_details: { 
        object_type: schema.object_details.object_type,
        id_field_name: schema.object_details.id_field_name
      },
      missingProperties: [],
      missingSensitiveProperties: []
    }

    return Promise.resolve(schemaDiff)
  }

  propsAndMatchType(response: ResponseType, properties: Prop[]): {missingProps: Prop[], match: SchemaMatch} {    
    switch(response.status) {
      case 'fulfilled': {
        const results = response.value?.data.results ?? []
        const missingProps: Prop[] = []
  
        properties.forEach((prop) => {
          const match = results.find((item: Result) => {
            return item.name === prop.name
          })
          
          if (match && (match.fieldType !== prop.fieldType || match.type !== prop.type)) {
            throw new IntegrationError(
              `Payload property with name ${prop.name} has a different type to the property in HubSpot. Expected: type = ${prop.type} fieldType = ${prop.fieldType}. Received: type = ${match.type} fieldType = ${match.fieldType}`,
              'HUBSPOT_PROPERTY_TYPE_MISMATCH',
              400
            )
          }
    
          if (!match) {
            missingProps.push({
              name: prop.name,
              type: prop.type,
              fieldType: prop.fieldType,
              typeFieldType: prop.typeFieldType
            })
          }

        })
        return { missingProps, match: missingProps.length === 0 ? SchemaMatch.FullMatch : SchemaMatch.PropertiesMissing }
      }

      case 'rejected': {
        if (response.reason?.message.startsWith(OBJECT_NOT_FOUND_ERROR_RESPONSE)) {
          return {missingProps: [], match: SchemaMatch.NoMatch}
        } else {
          throw new IntegrationError(`Error fetching Hubspot property data: ${response.reason?.message}`, 'HUBSPOT_PROPERTY_FETCH_ERROR', 400);
        }
      }
    }
  }

  async schemaDiffHubspot(schema: Schema): Promise<SchemaDiff> {
    const requests = []
    const hasProps = schema.properties.length
    const hasSensitiveProps = schema.sensitiveProperties.length
 
    if (hasProps) {
      requests.push(
        this.request<ResponseType>(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}`, {
          method: 'GET',
          skipResponseCloning: true
        })
      )
    }

    if (hasSensitiveProps) {
      requests.push(
        this.request<ResponseType>(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}?dataSensitivity=sensitive`, {
          method: 'GET',
          skipResponseCloning: true
        })
      )
    }

    const responses = await Promise.allSettled(requests)

    const schemaDiff = {
      object_details: { 
        object_type: schema.object_details.object_type,
        id_field_name: schema.object_details.id_field_name
      }
    } as SchemaDiff

    if (hasProps && requests.length > 0) {
      
      const response = responses.shift() 
      const { missingProps, match } = this.propsAndMatchType(response as ResponseType, schema.properties)
      schemaDiff.missingProperties = missingProps
      schemaDiff.match = match
    
    }
    
    if (hasSensitiveProps && requests.length > 0) {

      const response = responses.shift()
      const { missingProps, match } = this.propsAndMatchType(response as ResponseType, schema.sensitiveProperties)   
      schemaDiff.missingSensitiveProperties = missingProps
      
      if(schemaDiff.match === SchemaMatch.NoMatch && schemaDiff.match !== SchemaMatch.NoMatch) {
        // this should never happen. If it does, throw an error
        throw new IntegrationError('Unable to fetch property data from Hubspot', 'HUBSPOT_PROPERTIES_ERROR', 400)
      }

      if(schemaDiff.match === SchemaMatch.FullMatch) {
        schemaDiff.match = match
      }
    }

    return schemaDiff
  }

  async createProperties(schemaDiff: SchemaDiff){
    if (!this.propertyGroup) {
      throw new PayloadValidationError(
        '"Property Group" is a required field when creating properties on an Object Schema in Hubspot'
      )
    }

    if (schemaDiff.missingProperties.length === 0 || schemaDiff.missingSensitiveProperties.length === 0) {
      return
    }

    interface Input {
      name: string
      label: string
      groupName: string
      type: string
      dataSensitivity: 'sensitive' | undefined
      fieldType: string
      options?: Array<{ label: string; value: string; hidden: boolean; description: string; displayOrder: number }>
    }
    interface RequestBody {
      inputs: Array<Input>
    }

    const { missingProperties: props, missingSensitiveProperties: sensitiveProps } = schemaDiff 

    const input = (prop: Prop, sensitive: boolean): Input => {
      switch (prop.typeFieldType) {
        case HSPropTypeFieldType.NumberNumber:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'number',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'number'
          }
        case HSPropTypeFieldType.StringText:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'string',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'text'
          }
        case HSPropTypeFieldType.EnumerationBooleanCheckbox:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'enumeration',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'booleancheckbox',
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
        case HSPropTypeFieldType.DateTimeDate:
            return {
              name: prop.name,
              label: prop.name,
              groupName: this.propertyGroup as string,
              type: 'datetime',
              dataSensitivity: sensitive === true ? 'sensitive' : undefined,
              fieldType: 'date'
            }
        case HSPropTypeFieldType.DateDate:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'date',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'date'
          }
      }
    }

    const json: RequestBody = {
      inputs: [
        ...props.map((p) => input(p, false)),
        ...sensitiveProps.map((p) => input(p, true))
      ]
    } as RequestBody

    console.log('creating properties' + JSON.stringify({ 
      url: `${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}/batch/create`,
      json
    }))

    await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}/batch/create`, {
      method: 'POST',
      skipResponseCloning: true,
      json
    })
  }

  async batchObjectRequest(
    action: BatchRequestType,
    objectType: string,
    data: ReadJSON | UpsertJSON | CreateJSON
  ) {
    return this.request<RespJSON>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`, {
      method: 'POST',
      json: data
    })
  }

  addRecordIds(payloads: Payload[], response: ModifiedResponse<RespJSON>): (ExtendedPayload | Payload)[] {

    response?.data?.results.forEach((result) => {
      payloads
        .filter((p) => {
          return (
            p.object_details.id_field_value == (result.properties[p.object_details.id_field_name] as string)
          )
        })
        .forEach((p) => {
          return ((p as ExtendedPayload).object_details.record_id = result.id)
        })
    })

    return payloads as (ExtendedPayload | Payload)[]
  }

  async sendEvents(payloads: Payload[]): Promise<ExtendedPayload[]> {
    switch (this.syncMode) {

      case SyncMode.Upsert: {
        return await this.upsertRecords(payloads, this.objectType)
      }

      case SyncMode.Update: {
        return await this.updateRecords(payloads, this.objectType)
      }

      case SyncMode.Add: {
        return await this.addRecords(payloads, this.objectType)
      }
    }
  }

  async upsertRecords(payloads: Payload[], objectType: string): Promise<ExtendedPayload[]> {
    const response = await this.batchObjectRequest(BatchRequestType.Upsert, objectType, {
      inputs: payloads.map(
        ({ object_details: { id_field_value }, properties, sensitive_properties }) => {
          return {
            idProperty: this.idFieldName,
            id: id_field_value,
            properties: { ...properties, ...sensitive_properties, [this.idFieldName]: id_field_value }
          }
        }
      )
    } as UpsertJSON)

    return this.addRecordIds(payloads, response).filter(
      (payload) => (payload as ExtendedPayload).object_details.record_id
    ) as ExtendedPayload[]
  }

  async updateRecords(payloads: Payload[], objectType: string): Promise<ExtendedPayload[]> {
    const readResponse = await this.batchObjectRequest(BatchRequestType.Read, objectType, {
      properties: [this.idFieldName],
      idProperty: this.idFieldName,
      inputs: payloads.map((payload) => {
        return { id: payload.object_details.id_field_value }
      })
    } as ReadJSON)

    const existingRecords = this.addRecordIds(payloads, readResponse).filter(
      (payload) => (payload as ExtendedPayload).object_details.record_id
    )

    const response = await this.batchObjectRequest(BatchRequestType.Update, this.objectType, {
      inputs: existingRecords.map(
        ({ object_details: { id_field_value }, properties, sensitive_properties }) => {
          return {
            idProperty: this.idFieldName,
            id: id_field_value,
            properties: { ...properties, ...sensitive_properties }
          }
        }
      )
    } as UpsertJSON)

    return this.addRecordIds(existingRecords, response).filter(
      (payload) => (payload as ExtendedPayload).object_details.record_id
    ) as ExtendedPayload[]
  }

  async addRecords(payloads: Payload[], objectType: string): Promise<ExtendedPayload[]> {

    const readResponse = await this.batchObjectRequest(BatchRequestType.Read, objectType, {
      properties: [this.idFieldName],
      idProperty: this.idFieldName,
      inputs: payloads.map((payload) => {
        return { id: payload.object_details.id_field_value }
      })
    } as ReadJSON)

    const recordsToCreate = this.addRecordIds(payloads, readResponse).filter(
      (payload) => !(payload as ExtendedPayload).object_details.record_id
    )

    const response: ModifiedResponse<RespJSON> = await this.batchObjectRequest(BatchRequestType.Create, this.objectType, {
      inputs: recordsToCreate.map(
        ({ object_details: { id_field_value: fromIdFieldValue }, properties, sensitive_properties }) => {
          return {
            idProperty: this.idFieldName,
            properties: { ...properties, ...sensitive_properties, [this.idFieldName]: fromIdFieldValue }
          }
        }
      )
    } as CreateJSON)

    return this.addRecordIds(recordsToCreate, response).filter(
      (payload) => (payload as ExtendedPayload).object_details.record_id
    ) as ExtendedPayload[]
  }

  associationPayloads(payloads: Payload[], groupBy: ['object_type'] | ['object_type', 'id_field_name']): AssociationPayload[][] {

    const associationPayloads: AssociationPayload[] = payloads.flatMap(payload => Array.isArray(payload.associations) ? payload.associations : []) as AssociationPayload[]

    const groupedPayloads: AssociationPayload[][] = []

    const groups: { [key: string]: AssociationPayload[] } = associationPayloads.reduce((acc, payload) => {
      const key = groupBy.map((prop) => payload[prop]).join('_')
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(payload)
        return acc
      }, {} as { [key: string]: AssociationPayload[]   
    })

    for (const key in groups) {
      const items = groups[key]
      for (let i = 0; i < items.length; i += MAX_HUBSPOT_BATCH_SIZE) {
        groupedPayloads.push(items.slice(i, i + MAX_HUBSPOT_BATCH_SIZE))
      }
    }

    return groupedPayloads
  }

}