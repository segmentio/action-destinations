import { RequestClient, IntegrationError, ModifiedResponse, PayloadValidationError } from '@segment/actions-core'
import { HubSpotError } from '../errors'
import { HUBSPOT_BASE_URL } from '../properties'
import { MAX_HUBSPOT_BATCH_SIZE } from './constants'
import type { Payload } from './generated-types'

interface Association {
  to_object_type: string
  association_label: string
  to_id_field_name: string
  to_id_field_value: string
  to_record_id?: string
  from_record_id?: string
}

interface ReadPropertiesResultItem {
  name: string
  type: string
  fieldType: string
  hasUniqueValue: boolean
}

type HubspotStringType = 'date' | 'datetime' | 'string'
export interface PayloadPropertyItem {
  name: string
  type: string | number | boolean | object | null
  format: HubspotStringType
}

enum AssociationCategory {
  HUBSPOT_DEFINED = 'HUBSPOT_DEFINED',
  USER_DEFINED = 'USER_DEFINED',
  INTEGRATOR_DEFINED = 'INTEGRATOR_DEFINED'
}

interface BatchObjReadReqBody {
  idProperty: string
  properties: string[]
  inputs: Array<{ id: string }>
}

interface BatchObjUpsertReqBody {
  inputs: Array<{
    idProperty: string
    id: string
    properties: Record<string, string>
  }>
}
interface BatchObjCreateReqBody {
  inputs: Array<{
    idProperty: string
    properties: Record<string, string>
  }>
}

interface BatchObjResponse {
  status: string
  results: Array<{
    id: string
    properties: Record<string, string | null>
  }>
}

interface AssociationType {
  associationCategory: AssociationCategory
  associationTypeId: string
}

interface BatchAssociationsRequestBody {
  inputs: {
    types: AssociationType[]
    from: {
      id: string
    }
    to: {
      id: string
    }
  }[]
}

export type AssociationSyncMode = 'upsert' | 'read'

export type SyncMode = 'upsert' | 'add' | 'update'

export type HubspotSyncMode = 'upsert' | 'create' | 'update'

export class HubspotClient {
  request: RequestClient
  fromObjectType: string
  fromIdFieldName: string
  associationSyncMode: AssociationSyncMode
  hubspotSyncMode: HubspotSyncMode
  fromPropertyGroup?: string

  constructor(
    request: RequestClient,
    fromObjectType: string,
    fromIdFieldName: string,
    syncMode: SyncMode,
    associationSyncMode: AssociationSyncMode,
    fromPropertyGroup: string | undefined
  ) {
    this.request = request
    this.associationSyncMode = associationSyncMode
    this.fromObjectType = fromObjectType
    this.fromIdFieldName = fromIdFieldName
    this.hubspotSyncMode = this.mapHubspotSyncMode(syncMode)
    this.fromPropertyGroup = fromPropertyGroup
  }

  mapHubspotSyncMode(syncMode: SyncMode): HubspotSyncMode {
    switch (syncMode) {
      case 'upsert':
        return 'upsert'
      case 'add':
        return 'create'
      case 'update':
        return 'update'
      default:
        throw new Error('Invalid sync mode')
    }
  }

  async propertiesFromHSchema(
    fetchProperties: boolean,
    fetchSensitiveProperties: boolean
  ): Promise<{ properties: ReadPropertiesResultItem[]; sensitiveProperties: ReadPropertiesResultItem[] }> {
    interface ResponseType {
      data: {
        status: string
        results: ReadPropertiesResultItem[]
      }
    }

    const requests: Promise<ResponseType>[] = []

    if (fetchProperties) {
      requests.push(
        this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.fromObjectType}`, {
          method: 'GET',
          skipResponseCloning: true
        })
      )
    }

    if (fetchSensitiveProperties) {
      requests.push(
        this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.fromObjectType}?dataSensitivity=sensitive`, {
          method: 'GET',
          skipResponseCloning: true
        })
      )
    }

    try {
      const responses = await Promise.all(requests)

      const result: {
        properties: ReadPropertiesResultItem[]
        sensitiveProperties: ReadPropertiesResultItem[]
      } = {
        properties: [],
        sensitiveProperties: []
      }

      if (fetchProperties && requests.length > 0) {
        const propertiesResponse = responses.shift() // Remove and get the first response

        result.properties =
          (propertiesResponse?.data.results.map((item: ReadPropertiesResultItem) => ({
            name: item.name,
            type: item.type,
            fieldType: item.fieldType,
            hasUniqueValue: item.hasUniqueValue
          })) as ReadPropertiesResultItem[]) ?? []
      }

      if (fetchSensitiveProperties && requests.length > 0) {
        const sensitivePropertiesResponse = responses.shift() // Remove and get the next response

        result.sensitiveProperties =
          (sensitivePropertiesResponse?.data.results.map((item: ReadPropertiesResultItem) => ({
            name: item.name,
            type: item.type,
            fieldType: item.fieldType,
            hasUniqueValue: item.hasUniqueValue
          })) as ReadPropertiesResultItem[]) ?? []
      }

      return result
    } catch (err) {
      throw new IntegrationError(
        `readProperties() failed: ${
          (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: readProperties() failed'
        }`,
        'HUBSPOT_READ_PROPERTIES_FAILED',
        400
      )
    }
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

  uniquePayloadsProperties(payloads: Payload[]): {
    uniqueProperties: PayloadPropertyItem[]
    uniqueSensitiveProperties: PayloadPropertyItem[]
  } {
    const uniqueProperties = Object.values(
      payloads.reduce((acc, payload) => {
        if (payload.properties) {
          Object.keys(payload.properties).forEach((propName) => {
            if (payload.properties) {
              const value = payload.properties[propName]
              const type = typeof payload.properties[propName]
              const format = type === 'string' ? this.hubspotStringType(value as string) : 'string'
              acc[propName] = {
                name: propName,
                type,
                format
              }
            }
          })
        }
        return acc
      }, {} as { [name: string]: PayloadPropertyItem })
    )

    const uniqueSensitiveProperties = Object.values(
      payloads.reduce((acc, payload) => {
        if (payload.sensitiveProperties) {
          Object.keys(payload.sensitiveProperties).forEach((propName) => {
            if (payload.sensitiveProperties) {
              const value = payload.sensitiveProperties[propName]
              const type = typeof payload.sensitiveProperties[propName]
              const format = type === 'string' ? this.hubspotStringType(value as string) : 'string'
              acc[propName] = {
                name: propName,
                type,
                format
              }
            }
          })
        }
        return acc
      }, {} as { [name: string]: PayloadPropertyItem })
    )

    return {
      uniqueProperties,
      uniqueSensitiveProperties
    }
  }

  propertiesToCreateInHSSchema(
    uniquePayloadProperties: PayloadPropertyItem[],
    hubspotProperties: ReadPropertiesResultItem[]
  ): PayloadPropertyItem[] {
    return uniquePayloadProperties.filter((prop) => !hubspotProperties.find((p) => p.name === prop.name))
  }

  cleanProperties(payloads: Payload[]): Payload[] {
    const deepCopy = JSON.parse(JSON.stringify(payloads)) as Payload[]
    
    deepCopy.forEach((payload) => {
      
      if (payload.properties) {

        payload.properties = Object.keys(payload.properties).reduce((acc, prop) => {
          const lowerCasedProp = prop.toLowerCase();
          if (payload.properties && typeof payload.properties[prop] === 'object') {
            acc[lowerCasedProp] = JSON.stringify(payload.properties[prop], null, 2)
          } else {
            acc[lowerCasedProp] = payload.properties ? payload.properties[prop] : undefined
          }
          return acc;
        }, {} as { [key: string]: unknown })
      }
    
      if (payload.sensitiveProperties) {
        payload.sensitiveProperties = Object.keys(payload.sensitiveProperties).reduce((acc, prop) => {
          const lowerCasedProp = prop.toLowerCase();
          if (payload.sensitiveProperties && typeof payload.sensitiveProperties[prop] === 'object') {
            acc[lowerCasedProp] = JSON.stringify(payload.sensitiveProperties[prop], null, 2)
          } else {
            acc[lowerCasedProp] = payload.sensitiveProperties ? payload.sensitiveProperties[prop] : undefined
          }
          return acc;
        }, {} as { [key: string]: unknown })
      }

    })
    return deepCopy
  }

  async ensurePropertiesInHSSchema(properties: PayloadPropertyItem[], sensitiveProperties: PayloadPropertyItem[]) {
    if (!this.fromPropertyGroup) {
      throw new PayloadValidationError(
        '"Property Group" is a required field when creating properties on an Object Schema in Hubspot'
      )
    }

    if ((!properties || properties.length === 0) && (!sensitiveProperties || sensitiveProperties.length === 0)) {
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

    const generateInputMapping = (prop: PayloadPropertyItem, sensitive: boolean): Input => {
      switch (prop.type) {
        case 'number':
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.fromPropertyGroup as string,
            type: 'number',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'number'
          }
        case 'object':
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.fromPropertyGroup as string,
            type: 'string',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'text'
          }
        case 'boolean':
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.fromPropertyGroup as string,
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
        case 'string':
          switch (prop.format) {
            case 'string':
              return {
                name: prop.name,
                label: prop.name,
                groupName: this.fromPropertyGroup as string,
                type: 'string',
                dataSensitivity: sensitive === true ? 'sensitive' : undefined,
                fieldType: 'text'
              }
            case 'date':
              return {
                name: prop.name,
                label: prop.name,
                groupName: this.fromPropertyGroup as string,
                type: 'date',
                dataSensitivity: sensitive === true ? 'sensitive' : undefined,
                fieldType: 'date'
              }
            case 'datetime':
              return {
                name: prop.name,
                label: prop.name,
                groupName: this.fromPropertyGroup as string,
                type: 'datetime',
                dataSensitivity: sensitive === true ? 'sensitive' : undefined,
                fieldType: 'date'
              }
          }
      }
      throw new PayloadValidationError('Invalid property type')
    }

    const json: RequestBody = {
      inputs: [
        ...properties.map((prop) => generateInputMapping(prop, false)),
        ...sensitiveProperties.map((prop) => generateInputMapping(prop, true))
      ]
    } as RequestBody

    await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.fromObjectType}/batch/create`, {
      method: 'POST',
      skipResponseCloning: true,
      json
    })
  }

  groupAssociations(associations: Association[], groupBy: (keyof Association)[]): Association[][] {
    const groupedAssociations: Association[][] = []

    const groups: { [key: string]: Association[] } = associations.reduce((acc, association) => {
      const key = groupBy.map((prop) => association[prop]).join('_')
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(association)
      return acc
    }, {} as { [key: string]: Association[] })

    for (const key in groups) {
      const items = groups[key]
      for (let i = 0; i < items.length; i += MAX_HUBSPOT_BATCH_SIZE) {
        groupedAssociations.push(items.slice(i, i + MAX_HUBSPOT_BATCH_SIZE))
      }
    }

    return groupedAssociations
  }

  getAssociationsFromPayloads(payloads: Payload[]): Association[] {
    const payloadsDeepCopy = JSON.parse(JSON.stringify(payloads)) as Payload[]

    const allAssociations: Association[] = []

    payloadsDeepCopy.forEach((payload) => {
      const associations = payload.associations ?? []
      associations.forEach((association) => {
        association.from_record_id = payload.object_details.from_record_id
        allAssociations.push(association)
      })
    })

    return allAssociations
  }

  async batchObjectRequest(
    action: HubspotSyncMode | AssociationSyncMode,
    objectType: string,
    data: BatchObjReadReqBody | BatchObjUpsertReqBody | BatchObjCreateReqBody
  ) {
    return this.request<BatchObjResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`, {
      method: 'POST',
      json: data
    })
  }

  async ensureToRecordsOnHubspot(associations: Association[]): Promise<Association[]> {
    const associationsDeepCopy = JSON.parse(JSON.stringify(associations))

    let requests: Promise<ModifiedResponse<BatchObjResponse>>[]
    let groupedAssociations: Association[][]

    switch (this.associationSyncMode) {
      case 'upsert': {
        groupedAssociations = this.groupAssociations(associationsDeepCopy, ['to_object_type'])

        requests = groupedAssociations.map(async (associations) => {
          const { to_object_type: toObjectType } = associations[0]
          return await this.batchObjectRequest(this.associationSyncMode, toObjectType, {
            inputs: associations.map((association) => {
              return {
                idProperty: association.to_id_field_name,
                id: association.to_id_field_value,
                properties: {
                  [association.to_id_field_name]: association.to_id_field_value
                }
              }
            })
          } as BatchObjUpsertReqBody)
        })
        break
      }
      case 'read': {
        groupedAssociations = this.groupAssociations(associationsDeepCopy, ['to_object_type', 'to_id_field_name'])

        requests = groupedAssociations.map(async (associations) => {
          const { to_object_type: toObjectType, to_id_field_name: toIdFieldName } = associations[0]
          return await this.batchObjectRequest(this.associationSyncMode, toObjectType, {
            idProperty: toIdFieldName,
            properties: [toIdFieldName],
            inputs: associations.map((association) => {
              return {
                id: association.to_id_field_value
              }
            })
          } as BatchObjReadReqBody)
        })
        break
      }
    }

    const responses = await Promise.all(requests)

    responses.forEach((response, index) => {
      const associations = groupedAssociations[index]
      response?.data?.results.forEach((result) => {
        associations
          .filter(
            (association) =>
              association.to_id_field_value == (result.properties[association.to_id_field_name] as string)
          )
          .forEach((association) => (association.to_record_id = result.id))
      })
    })

    switch (this.associationSyncMode) {
      case 'upsert': {
        return groupedAssociations.flat().filter((association) => association.to_record_id)
      }
      case 'read': {
        return groupedAssociations.flat()
      }
    }
  }

  insertRecordIds(payloads: Payload[], response: ModifiedResponse<BatchObjResponse>): Payload[] {
    const payloadsDeepCopy = JSON.parse(JSON.stringify(payloads)) as Payload[]
    response?.data?.results.forEach((result) => {
      payloadsDeepCopy
        .filter((p) => {
          return (
            p.object_details.from_id_field_value == (result.properties[p.object_details.from_id_field_name] as string)
          )
        })
        .forEach((p) => {
          return (p.object_details.from_record_id = result.id)
        })
    })
    return payloadsDeepCopy
  }

  async ensureFromRecordsOnHubspot(payloads: Payload[]): Promise<Payload[]> {
    const payloadsDeepCopy = JSON.parse(JSON.stringify(payloads)) as Payload[]

    let response: ModifiedResponse<BatchObjResponse>

    switch (this.hubspotSyncMode) {
      case 'upsert': {
        response = await this.batchObjectRequest(this.hubspotSyncMode, this.fromObjectType, {
          inputs: payloadsDeepCopy.map(
            ({ object_details: { from_id_field_value }, properties, sensitiveProperties }) => {
              return {
                idProperty: this.fromIdFieldName,
                id: from_id_field_value,
                properties: { ...properties, ...sensitiveProperties, [this.fromIdFieldName]: from_id_field_value }
              }
            }
          )
        } as BatchObjUpsertReqBody)

        return this.insertRecordIds(payloadsDeepCopy, response).filter(
          (payload) => payload.object_details.from_id_field_value
        )
      }
      case 'update': {
        const readResponse = await this.batchObjectRequest('read', this.fromObjectType, {
          properties: [this.fromIdFieldName],
          idProperty: this.fromIdFieldName,
          inputs: payloadsDeepCopy.map((payload) => {
            return { id: payload.object_details.from_id_field_value }
          })
        } as BatchObjReadReqBody)

        const existingRecords = this.insertRecordIds(payloadsDeepCopy, readResponse).filter(
          (payload) => payload.object_details.from_record_id
        )

        response = await this.batchObjectRequest(this.hubspotSyncMode, this.fromObjectType, {
          inputs: existingRecords.map(
            ({ object_details: { from_id_field_value }, properties, sensitiveProperties }) => {
              return {
                idProperty: this.fromIdFieldName,
                id: from_id_field_value,
                properties: { ...properties, ...sensitiveProperties }
              }
            }
          )
        } as BatchObjUpsertReqBody)

        return this.insertRecordIds(existingRecords, response).filter(
          (payload) => payload.object_details.from_id_field_value
        )
      }
      case 'create': {
        const readResponse = await this.batchObjectRequest('read', this.fromObjectType, {
          properties: [this.fromIdFieldName],
          idProperty: this.fromIdFieldName,
          inputs: payloadsDeepCopy.map((payload) => {
            return { id: payload.object_details.from_id_field_value }
          })
        } as BatchObjReadReqBody)

        const nonExistingRecords = this.insertRecordIds(payloadsDeepCopy, readResponse).filter(
          (payload) => !payload.object_details.from_record_id
        )

        response = await this.batchObjectRequest(this.hubspotSyncMode, this.fromObjectType, {
          inputs: nonExistingRecords.map(
            ({ object_details: { from_id_field_value: fromIdFieldValue }, properties, sensitiveProperties }) => {
              return {
                idProperty: this.fromIdFieldName,
                properties: { ...properties, ...sensitiveProperties, [this.fromIdFieldName]: fromIdFieldValue }
              }
            }
          )
        } as BatchObjCreateReqBody)
        return this.insertRecordIds(nonExistingRecords, response).filter(
          (payload) => payload.object_details.from_id_field_value
        )
      }
    }
  }

  async batchAssociationsRequest(body: BatchAssociationsRequestBody, toObjectType: string) {
    return this.request(`${HUBSPOT_BASE_URL}/crm/v4/associations/${this.fromObjectType}/${toObjectType}/batch/create`, {
      method: 'POST',
      json: body
    })
  }

  async ensureAssociations(associations: Association[]) {
    const associationsDeepCopy = JSON.parse(JSON.stringify(associations))

    const groupedAssociations: Association[][] = this.groupAssociations(associationsDeepCopy, ['to_object_type'])

    function getAssociationType(associationLabel: string): AssociationType {
      const [associationCategory, associationTypeId] = associationLabel.split(':')
      return { associationCategory, associationTypeId } as AssociationType
    }

    const requests = groupedAssociations.map(async (group) => {
      const toObjectType = group[0].to_object_type

      const inputs = group.map((association) => {
        const { associationCategory, associationTypeId } = getAssociationType(association.association_label)
        const input = {
          types: [
            {
              associationCategory,
              associationTypeId
            }
          ],
          from: {
            id: association.from_record_id ?? ''
          },
          to: {
            id: association.to_record_id ?? ''
          }
        }
        return input
      })
      return this.batchAssociationsRequest({ inputs }, toObjectType)
    })

    await Promise.all(requests)
  }
}
