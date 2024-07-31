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

export interface PayloadPropertyItem {
  name: string
  type: string | number | boolean | null
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

  async propertiesFromHSchema(): Promise<ReadPropertiesResultItem[]> {
    interface ResponseType {
      data: {
        status: string
        results: ReadPropertiesResultItem[]
      }
    }

    try {
      const response: ResponseType = await this.request(
        `${HUBSPOT_BASE_URL}/crm/v3/properties/${this.fromObjectType}`,
        {
          method: 'GET',
          skipResponseCloning: true
        }
      )

      return response.data.results.map((item: ReadPropertiesResultItem) => {
        return {
          name: item.name,
          type: item.type,
          fieldType: item.fieldType,
          hasUniqueValue: item.hasUniqueValue
        }
      }) as ReadPropertiesResultItem[]
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

  uniquePayloadsProperties(payloads: Payload[]): PayloadPropertyItem[] {
    return Object.values(
      payloads.reduce((acc, payload) => {
        if (payload.properties) {
          Object.keys(payload.properties).forEach((propName) => {
            if (payload.properties) {
              // to keep linter happy
              acc[propName] = {
                name: propName,
                type: typeof payload.properties[propName]
              }
            }
          })
        }
        return acc
      }, {} as { [name: string]: PayloadPropertyItem })
    )
  }

  propertiesToCreateInHSSchema(
    uniquePayloadProperties: PayloadPropertyItem[],
    hubspotProperties: ReadPropertiesResultItem[]
  ): PayloadPropertyItem[] {
    return uniquePayloadProperties.filter((prop) => !hubspotProperties.find((p) => p.name === prop.name))
  }

  async ensurePropertiesInHSSchema(properties: PayloadPropertyItem[]) {
    if (!this.fromPropertyGroup) {
      throw new PayloadValidationError(
        '"Property Group" is a required field when creating properties on an Object Schema in Hubspot'
      )
    }

    if (!properties || properties.length === 0) {
      return
    }
    interface RequestBody {
      inputs: Array<{
        label: string
        type: 'string' | 'number' | 'enumeration'
        groupName: string
        name: string
        fieldType: 'text' | 'number' | 'booleancheckbox'
        options?: Array<{
          label: string
          value: string
          hidden: boolean
          description: string
          displayOrder: 1 | 2
        }>
      }>
    }

    const json = {
      inputs: properties.map((prop) => {
        switch (prop.type) {
          case 'string':
            return {
              name: prop.name,
              label: prop.name,
              groupName: this.fromPropertyGroup,
              type: 'string',
              fieldType: 'text'
            }
          case 'number':
            return {
              name: prop.name,
              label: prop.name,
              groupName: this.fromPropertyGroup,
              type: 'number',
              fieldType: 'number'
            }
          case 'boolean':
            return {
              name: prop.name,
              label: prop.name,
              groupName: this.fromPropertyGroup,
              type: 'enumeration',
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
        }
      })
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
          inputs: payloadsDeepCopy.map(({ object_details: { from_id_field_value }, properties }) => {
            return {
              idProperty: this.fromIdFieldName,
              id: from_id_field_value,
              properties: { ...properties, [this.fromIdFieldName]: from_id_field_value }
            }
          })
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
          inputs: existingRecords.map(({ object_details: { from_id_field_value }, properties }) => {
            return {
              idProperty: this.fromIdFieldName,
              id: from_id_field_value,
              properties: properties
            }
          })
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
            ({ properties, object_details: { from_id_field_value: fromIdFieldValue } }) => {
              return {
                idProperty: this.fromIdFieldName,
                properties: { ...properties, [this.fromIdFieldName]: fromIdFieldValue }
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
