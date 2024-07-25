import { RequestClient, IntegrationError } from '@segment/actions-core'
import { HubSpotError } from '../errors'
import { HUBSPOT_BASE_URL } from '../properties'
import { MAX_HUBSPOT_BATCH_SIZE } from './constants'
import type { Payload } from './generated-types'

interface Association {
    to_object_type: string,
    association_label: string,
    to_id_field_name: string,
    to_id_field_value: string,
    to_record_id?: string,
    from_record_id?: string
}

interface ReadPropertiesResultItem {
    name: string,
    type: string
    fieldType: string,
    hasUniqueValue: boolean
}

interface PayloadPropertyItem {
    name: string;
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
interface BatchObjAddReqBody {
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
        types: AssociationType[];
        from: {
            id: string;
        };
        to: {
            id: string;
        };
    }[];
}

export type AssociationSyncMode = "upsert" | "read"

export type SyncMode = "upsert" | "add" | "update"

export type HubspotSyncMode = "upsert" | "read" | "create" | "update"

export class HubspotClient {
    request: RequestClient
    fromObjectType: string
    fromIdFieldName: string
    associationSyncMode: AssociationSyncMode
    hubspotSyncMode: HubspotSyncMode

    constructor(request: RequestClient, fromObjectType: string, fromIdFieldName: string, syncMode: SyncMode, associationSyncMode: AssociationSyncMode) {
        this.request = request
        this.associationSyncMode = associationSyncMode
        this.fromObjectType = fromObjectType
        this.fromIdFieldName = fromIdFieldName
        this.hubspotSyncMode = this.mapHubspotSyncMode(syncMode)
    }

    mapHubspotSyncMode(syncMode: SyncMode): HubspotSyncMode {
        switch (syncMode) {
            case 'upsert':
                return 'upsert';
            case 'add':
                return 'create';
            case 'update':
                return 'update';
            default:
                throw new Error('Invalid sync mode');
        }
    }

    async readProperties(objectType: string): Promise<ReadPropertiesResultItem[]> {
        interface ResponseType {
            data: {
                status: string
                results: ReadPropertiesResultItem[]
            } 
        }

        try{
            const response: ResponseType = await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}`, {
                method: 'GET',
                skipResponseCloning: true
            })

            return response.data.results
                .map((item: ReadPropertiesResultItem) => {
                    return {
                        name: item.name,
                        type: item.type,
                        fieldType: item.fieldType,
                        hasUniqueValue: item.hasUniqueValue
                    }
                }) as ReadPropertiesResultItem[]

        } catch(err) {
            throw new IntegrationError(`readProperties() failed: ${(err as HubSpotError)?.response?.data?.message ?? 'Unknown error: readProperties() failed'}`, 'HUBSPOT_READ_PROPERTIES_FAILED', 400)
        }
    }

    findUniquePayloadsProps(payloads: Payload[]): PayloadPropertyItem[] {        
        return Object.values(
            payloads.reduce((acc, payload) => {
                if(payload.properties) {
                    Object.keys(payload.properties).forEach(propName => {
                        if(payload.properties) { // to keep linter happy
                            acc[propName] = { 
                                name: propName, 
                                type: typeof payload.properties[propName]
                            }
                        }
                    })
                }
                return acc
            }, 
            {} as { [name: string]: PayloadPropertyItem })
        )
    }

    createListPropsToCreate(uniquePayloadProperties: PayloadPropertyItem[], hubspotProperties: ReadPropertiesResultItem[]): PayloadPropertyItem[]{
        return uniquePayloadProperties.filter(prop => !hubspotProperties.find(p => p.name === prop.name))
    }

    async ensurePropertiesInObjSchema(objectType: string, propertyGroup: string,  properties: PayloadPropertyItem[]){
  
        interface RequestBody {
            inputs: Array<{
                label: string,
                type: 'string' | 'number' | 'enumeration',
                groupName: string,
                name: string,
                fieldType: 'text' | 'number' | 'booleancheckbox',
                options?: Array<{
                    label: string,
                    value: string,
                    hidden: boolean,
                    description: string,
                    displayOrder: 1 | 2
                }>
            }> 
        }

        const json = { 
            inputs: properties.map(prop => {
                switch(prop.type){
                    case 'string':
                        return {
                            name: prop.name,
                            label: prop.name,
                            groupName: propertyGroup,
                            type: "string",
                            fieldType: "text"
                        }
                    case 'number':
                        return {
                            name: prop.name,
                            label: prop.name,
                            groupName: propertyGroup,
                            type: "number",
                            fieldType: "number"
                        }    
                    case 'boolean':
                        return {
                            name: prop.name,
                            label: prop.name,
                            groupName: propertyGroup,
                            type: "enumeration",
                            fieldType: 'booleancheckbox', 
                            options: [
                                {
                                    label: "true",
                                    value: "true",
                                    hidden: false,
                                    description: "True",
                                    displayOrder: 1
                                },
                                {
                                    label: "false",
                                    value: "false",
                                    hidden: false,
                                    description: "False",
                                    displayOrder: 2
                                }
                            ]
                        }
                }
            })
        } as RequestBody
        
        await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}/batch/create`, {
            method: 'POST',
            skipResponseCloning: true,
            json
        })
    }

    async batchObjectRequest(
        action: HubspotSyncMode, 
        objectType: string,
        data: BatchObjReadReqBody | BatchObjUpsertReqBody | BatchObjAddReqBody
    ) {   
        return this.request<BatchObjResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`, {
            method: 'POST',
            json: data
        });
    }

    async enrichPayloadsWithFromRecordIds(payloads: Payload[]): Promise<Payload[]> {    
        const updatedPayloads = JSON.parse(JSON.stringify(payloads)) as Payload[]
        
        const response = await this.batchObjectRequest('read', this.fromObjectType, {
            properties: [this.fromIdFieldName],
            idProperty: this.fromIdFieldName,
            inputs: updatedPayloads.map(payload => { 
                return {id: payload.object_details.from_id_field_value}
            })             
        } as BatchObjReadReqBody)

        response?.data.results.forEach(result => {
            updatedPayloads
                .filter(payload => payload.object_details.from_id_field_value == result.properties[this.fromIdFieldName] as string)
                .forEach(payload => payload.object_details.from_record_id = result.id )
        })

        return updatedPayloads
    }

    async ensureFromRecordsOnHubspot(payloads: Payload[], hubspotSyncMode: HubspotSyncMode): Promise<Payload[]> {
        const payloadsDeepCopy = JSON.parse(JSON.stringify(payloads)) as Payload[]
    
        const enriched = await this.enrichPayloadsWithFromRecordIds(payloadsDeepCopy) 
        const noRecordIds = enriched.filter(payload => !payload.object_details.from_record_id)
        const withRecordIds = enriched.filter(payload => payload.object_details.from_record_id)

        switch(hubspotSyncMode){
            case 'upsert': {
                const body: BatchObjUpsertReqBody = {
                    inputs: []
                }
                
                enriched.forEach(({ object_details: { from_id_field_value }, properties }) => {
                    body.inputs.push({
                      idProperty: this.fromIdFieldName,
                      id: from_id_field_value,
                      properties: properties 
                    })
                })
    
                await this.batchObjectRequest(hubspotSyncMode, this.fromObjectType, body)
                
                const upserted = await this.enrichPayloadsWithFromRecordIds(enriched)
              
                return upserted.filter(payload => payload.object_details.from_record_id)
            }
            case 'update': {
                const body: BatchObjUpsertReqBody = {
                    inputs: []
                }
            
                withRecordIds
                    .filter(({ object_details }) => object_details.from_record_id)
                    .forEach(({ object_details: { from_id_field_value }, properties }) => {
                        body.inputs.push({
                            idProperty: this.fromIdFieldName,
                            id: from_id_field_value,
                            properties
                        })
                    }) 

                await this.batchObjectRequest(hubspotSyncMode, this.fromObjectType, body)

                return withRecordIds
            }
            case 'create': {
                const body: BatchObjAddReqBody = {
                    inputs: []
                }
    
                noRecordIds
                .filter(({ object_details }) => !object_details.from_record_id)
                .forEach(({ object_details: { from_id_field_value }, properties }) => {
                    body.inputs.push({
                        idProperty: this.fromIdFieldName,
                        properties: { ...properties, [this.fromIdFieldName]: from_id_field_value },
                    })
                }) 
                
                await this.batchObjectRequest('create', this.fromObjectType, body)

                const addedRecords = await this.enrichPayloadsWithFromRecordIds(noRecordIds)

                return addedRecords.filter(payload => payload.object_details.from_record_id)
            }
            case 'read': {
                throw new IntegrationError('ensureFromRecordsExistInHubspot read is not a supported hubspotSyncMode', 'HUBSPOT_SYNC_MODE_NOT_SUPPORTED', 400)
            }
        }
    }

    groupAssociations (associations: Association[], groupBy: (keyof Association)[]): Association[][] {
        const groupedAssociations: Association[][] = [];
      
        const groups: { [key: string]: Association[] } = associations.reduce((acc, association) => {
          const key = groupBy.map(prop => association[prop]).join('_');
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(association);
          return acc;
        }, {} as { [key: string]: Association[] });
      
        for (const key in groups) {
          const items = groups[key];
          for (let i = 0; i < items.length; i += MAX_HUBSPOT_BATCH_SIZE) {
            groupedAssociations.push(items.slice(i, i + MAX_HUBSPOT_BATCH_SIZE));
          }
        }
      
        return groupedAssociations;
    }

    async batchAssociationsRequest(body: BatchAssociationsRequestBody, toObjectType: string){        
        return this.request<BatchReadResponse>(`${HUBSPOT_BASE_URL}/crm/v4/associations/${this.fromObjectType}/${toObjectType}/batch/create`, {
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
         
            const inputs = group.map(association => {
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

    getAssociations(payloads: Payload[]): Association[]{        
        const payloadsDeepCopy = JSON.parse(JSON.stringify(payloads)) as Payload[] 
        
        const allAssociations: Association[] = []
        
        payloadsDeepCopy.forEach(payload => {  
            const associations = payload.associations ?? []
            associations.forEach(association => {
                allAssociations.push(association)
            })
        })

        return allAssociations
    }

    async ensureToRecordsOnHubspot(associations: Association[]): Promise<Association[]> {
        const associationsDeepCopy = JSON.parse(JSON.stringify(associations))

        const groupedAssociations: Association[][] = this.groupAssociations(associationsDeepCopy, ['to_object_type', 'association_label', 'to_id_field_name'])

        const responses = await Promise.all(
            groupedAssociations.map(async associations => {
                const { to_object_type: toObjectType, to_id_field_name: toIdFieldName } = associations[0]
                return await this.batchObjectRequest(this.hubspotSyncMode, toObjectType, {
                    properties: [toIdFieldName],
                    idProperty: toIdFieldName,
                    inputs: associations.map(association => { 
                        return {
                            id: association.to_id_field_value
                        }
                    })             
                } as BatchObjReadReqBody);
            })
        )

        responses.forEach((response, index) => {
            const associations = groupedAssociations[index]
            response?.data?.results.forEach(result => {
                associations
                    .filter(association => association.to_id_field_value == result.properties[association.to_id_field_name] as string)
                    .forEach(association => association.to_record_id = result.id )
            })
        })

        switch(this.hubspotSyncMode){
            case 'upsert':
            case 'update':
            case 'create': {
                return groupedAssociations.flat().filter(association => association.to_record_id)
            }
            case 'read': {
                return groupedAssociations.flat()
            }
        }
    }

    async ensureAssociationsOnHubspot(payloads: Payload[]) {   
           
        const associations: Association[] = this.getAssociations(payloads)

        const toRecordsOnHubsot = await this.ensureToRecordsOnHubspot(associations)

        await this.ensureAssociations(toRecordsOnHubsot)
    }
}
