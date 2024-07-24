import { RequestClient, IntegrationError } from '@segment/actions-core'
import { HubSpotError } from '../errors'
import { HUBSPOT_BASE_URL } from '../properties'
import { SUPPORTED_HUBSPOT_OBJECT_TYPES, MAX_HUBSPOT_BATCH_SIZE } from './constants'
import type { Payload } from './generated-types'
import { DynamicFieldResponse } from '@segment/actions-core'


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

export class HubspotClient {
    request: RequestClient
    syncMode: string | null

    constructor(request: RequestClient, syncMode?: string) {
        this.request = request
        this.syncMode = syncMode ?? null
    }

    async dynamicReadIdFields(objectType: string) {

        interface ResultItem {
            label: string
            name: string
            hasUniqueValue: boolean
        }
        
        interface ResponseType {
            data: {
                results: ResultItem[]
            }
        }

        try {
            const response: ResponseType = await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}`, {
                method: 'GET',
                skipResponseCloning: true
            })
            
            return {
                choices: [
                    {
                        label: 'Hubspot Record ID (updates only)',
                        value: 'hs_object_id'
                    },
                    // hs_unique_creation_key is a unique identifier that is automatically generated by HubSpot. It is readonly so should not be included in the dynamic list
                    ...response.data.results
                    .filter((field: ResultItem) => field.hasUniqueValue && field.name != 'hs_unique_creation_key')
                    .map((field: ResultItem) => {
                        return {
                        label: field.label,
                        value: field.name
                        }
                    })
                ]
            }
        } catch (err) {
            return {
                choices: [],
                error: {
                    message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: getPropertyGroups',
                    code: (err as HubSpotError)?.response?.status + '' ?? '500'
                }
            }
        }
    }

    async dynamicReadPropertyGroups(objectType: string): Promise<DynamicFieldResponse> {
        interface ResultItem {
            label: string
            name: string
            displayOrder: number, 
            archived: boolean
        }
        
        interface ResponseType {
            data: {
                results: ResultItem[]
            }
        }

        try {
            const response: ResponseType = await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}/groups`, {
                method: 'GET',
                skipResponseCloning: true
            })

            return { choices: response.data.results
                .filter(result => !result.archived)
                .map((result) => ({
                label: result.label,
                value: result.name
            })) }

        } catch (err) {
            return {
                choices: [],
                error: {
                    message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: getPropertyGroups',
                    code: (err as HubSpotError)?.response?.status + '' ?? '500'
                }
            }
        }
    }

    async dynamicReadAssociationLabels(fromObjectType: string, toObjectType: string): Promise<DynamicFieldResponse> {
        interface ResultItem {
            category: AssociationCategory
            typeId: number
            label: string
        }
        interface ResponseType {
            data: {
                results: ResultItem[]
            }
        }
        
        try {
            const response: ResponseType = await this.request(`${HUBSPOT_BASE_URL}/crm/v4/associations/${fromObjectType}/${toObjectType}/labels`, {
                method: 'GET',
                skipResponseCloning: true
            })

            return {
                choices: response?.data?.results?.map((res) => ({
                    label: !res.label ? `${fromObjectType} to ${toObjectType} (Type ${res.typeId})` : `${fromObjectType} to ${toObjectType} ${res.label}`,
                    value: `${res.category}:${res.typeId}`
                }))
            }
        } catch (err) {
            return {
                choices: [],
                error: {
                    message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error',
                    code: (err as HubSpotError)?.response?.data?.category ?? 'Unknown code'
                }
            }
        }
    }

    async dynamicReadObjectTypes(): Promise<DynamicFieldResponse> {
        interface ResultItem {
            labels: { singular: string; plural: string }
            fullyQualifiedName: string
        }
        
        interface ResponseType {
            data: {
                results: ResultItem[]
            }
        }
        
        const defaultChoices = SUPPORTED_HUBSPOT_OBJECT_TYPES
       
        try {
            const response: ResponseType = await this.request(`${HUBSPOT_BASE_URL}/crm/v3/schemas?archived=false`, {
                method: 'GET',
                skipResponseCloning: true
            })
            const choices = response.data.results
                .map((schema) => ({
                    label: `${schema.labels.plural} (Custom)`,
                    value: schema.fullyQualifiedName
                }))
            return {
                choices: [...choices, ...defaultChoices]
            }
        } catch (err) {
            return {
                choices: [],
                error: {
                    message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error',
                    code: (err as HubSpotError)?.response?.status + '' ?? '500'
                }
            }
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

    async ensureProperties(objectType: string, propertyGroup: string,  properties: PayloadPropertyItem[]){
  
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
        action: 'upsert' | 'create' | 'update' |'read', 
        objectType: string,
        data: BatchObjReadReqBody | BatchObjUpsertReqBody | BatchObjAddReqBody
    ) {   
        return this.request<BatchObjResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`, {
            method: 'POST',
            json: data
        });
    }

    async enrichPayloadsWithFromRecordIds(payloads: Payload[], fromObjectType: string, fromIdFieldName: string): Promise<Payload[]> {    
        const response = await this.batchObjectRequest('read', fromObjectType, {
            properties: [fromIdFieldName],
            idProperty: fromIdFieldName,
            inputs: payloads.map(payload => { 
                return {id: payload.object_details.from_id_field_value}
            })             
        } as BatchObjReadReqBody)

        response?.data.results.forEach(result => {
            payloads
                .filter(payload => payload.object_details.from_id_field_value == result.properties[fromIdFieldName] as string)
                .forEach(payload => payload.object_details.from_record_id = result.id )
        })

        return payloads
    }

    async ensureFromRecords(payloads: Payload[], syncMode: 'upsert' | 'add' | 'update') {
        const { 
            object_details: { 
                from_object_type: fromObjectType, 
                from_id_field_name: fromIdFieldName 
            } 
        } = payloads[0]

        switch(syncMode){
            case 'upsert': {
                const body: BatchObjUpsertReqBody = {
                    inputs: []
                }
                
                payloads.forEach(({ object_details: { from_id_field_value }, properties }) => {
                    body.inputs.push({
                      idProperty: fromIdFieldName,
                      id: from_id_field_value,
                      properties: properties 
                    })
                })
    
                return await this.batchObjectRequest(syncMode, fromObjectType, body)
            }

            case 'update': {
                const body: BatchObjUpsertReqBody = {
                    inputs: []
                }
            
                const enrichedPayloads = await this.enrichPayloadsWithFromRecordIds(payloads, fromObjectType, fromIdFieldName)

                // Records to be updated will have a recordId. We check this with the from_record_id field
                // Even though we have the recordId, the code below usses the from_id_field_value as an identifier for the record
                enrichedPayloads
                .filter(({ object_details }) => object_details.from_record_id)
                .forEach(({ object_details: { from_id_field_value }, properties }) => {
                    body.inputs.push({
                        idProperty: fromIdFieldName,
                        id: from_id_field_value,
                        properties
                    })
                }) 

                return await this.batchObjectRequest(syncMode, fromObjectType, body)
            }

            case 'add': {
                const body: BatchObjAddReqBody = {
                    inputs: []
                }
        
                const enrichedPayloads = await this.enrichPayloadsWithFromRecordIds(payloads, fromObjectType, fromIdFieldName)

                // Records that need to be be added won't have a recordId. We check this with the from_record_id field
                // The code below usses the from_id_field_value as an identifier for the record
                enrichedPayloads
                .filter(({ object_details }) => !object_details.from_record_id)
                .forEach(({ object_details: { from_id_field_value }, properties }) => {
                    body.inputs.push({
                        idProperty: fromIdFieldName,
                        properties: { ...properties, [fromIdFieldName]: from_id_field_value },
                    })
                }) 

                return await this.batchObjectRequest('create', fromObjectType, body)
            }
        }
    }






    getAssociationType(associationLabel: string): AssociationType {
        const [associationCategory, associationTypeId] = associationLabel.split(':');
        return { associationCategory, associationTypeId } as AssociationType
    }

    async batchAssociationsRequest(body: BatchAssociationsRequestBody, objectType: string, toObjectType: string){        
        return this.request<BatchReadResponse>(`${HUBSPOT_BASE_URL}/crm/v4/associations/${objectType}/${toObjectType}/batch/create`, {
            method: 'POST',
            json: body
        })
    }

    async ensureAssociations(associations: Association[], fromObjectType: string) {
        const groupedAssociations: Association[][] = this.groupAssociations(associations, ['to_object_type'])
     
        const requests = groupedAssociations.map(async (group) => {
            const toObjectType = group[0].to_object_type;
         
            const inputs = group.map(association => {
                const { associationCategory, associationTypeId } = this.getAssociationType(association.association_label);
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
            return this.batchAssociationsRequest({ inputs }, fromObjectType, toObjectType);
        })
    
        const responses = await Promise.all(requests)
        console.log(JSON.stringify(responses, null, 2))
    }

    async enrichAssociationsWithToRecordIds(groupedAssociations: Association[][]): Promise<Association[][]> {    
        
        const responses = await Promise.all(
            groupedAssociations.map(async associations => {
                return await this.batchObjectRequest('read', associations[0].to_object_type, {
                    properties: [associations[0].to_id_field_name],
                    idProperty: associations[0].to_id_field_name,
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

        return groupedAssociations
    }

    async enrichAssociationsWithFromRecordIds(payloads: Payload[]): Promise<Association[]>{
        const { 
            object_details: { 
                from_object_type: fromObjectType, 
                from_id_field_name: fromIdFieldName 
            }
        } = payloads[0]
        
        const payloadsWithRecordIds = await this.enrichPayloadsWithFromRecordIds(payloads, fromObjectType, fromIdFieldName)

        const allAssociations: Association[] = []
        
        payloadsWithRecordIds.forEach(payload => {  
            const associations = payload.associations ?? []
            associations.forEach(association => {
                association.from_record_id = payload.object_details?.from_record_id ?? undefined
                
                if(association.from_record_id){
                    allAssociations.push(association)
                }
            })
        })

        return allAssociations
    }

    // groupAssociations(associations: Association[]): Association[][] {
    //     const groupedAssociations: Association[][] = [];
  
    //     const groups: { [key: string]: Association[] } = associations.reduce((acc, association) => {
    //       const key = `${association.to_object_type}_${association.association_label}_${association.to_id_field_name}`;
    //       if (!acc[key]) {
    //         acc[key] = [];
    //       }
    //       acc[key].push(association);
    //       return acc;
    //     }, {} as { [key: string]: Association[] });
        
    //     for (const key in groups) {
    //       const items = groups[key];
    //       for (let i = 0; i < items.length; i += MAX_HUBSPOT_BATCH_SIZE) {
    //         groupedAssociations.push(items.slice(i, i + MAX_HUBSPOT_BATCH_SIZE));
    //       }
    //     }

    //     return groupedAssociations
    // }

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

    async buildToRecordRequest(payloads: Payload[]) {   
       
        const fromObjectType = payloads[0].object_details.from_object_type

        const allAssociations: Association[] = await this.enrichAssociationsWithFromRecordIds(payloads)

        const groupedAssociations: Association[][] = this.groupAssociations(allAssociations, ['to_object_type', 'association_label', 'to_id_field_name'])

        const associationsWithToRecordIds: Association[][] = await this.enrichAssociationsWithToRecordIds(groupedAssociations)

        const association_sync_mode = payloads[0].association_sync_mode
       
        if(association_sync_mode === 'do_not_create'){
            await this.ensureAssociations(associationsWithToRecordIds.flat().filter(association => association.to_record_id) , fromObjectType)
        } 
    }
}
