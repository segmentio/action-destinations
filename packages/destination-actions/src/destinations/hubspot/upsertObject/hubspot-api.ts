import { RequestClient, IntegrationError } from '@segment/actions-core'
import { HubSpotError } from '../errors'
import { HUBSPOT_BASE_URL } from '../properties'
import { SUPPORTED_HUBSPOT_OBJECT_TYPES } from './constants'
import type { Payload } from './generated-types'

interface ObjectSchema {
    labels: { singular: string; plural: string }
    fullyQualifiedName: string
}

interface GetSchemasResponse {
    results: ObjectSchema[]
}

enum AssociationCategory {
    HUBSPOT_DEFINED = 'HUBSPOT_DEFINED',
    USER_DEFINED = 'USER_DEFINED',
    INTEGRATOR_DEFINED = 'INTEGRATOR_DEFINED'
}

interface BatchReadRequestBody {
    properties: string[]
    idProperty: string
    inputs: Array<{ id: string }>
}

interface BatchReadResponse {
    status: string
    results: BatchReadResponseItem[]
}

interface BatchReadResponseItem {
    id: string
    properties: Record<string, string | null>
}

interface BatchRequestBody {
    inputs: BatchRequestBodyItem[];
}
interface BatchRequestBodyItem {
    properties: {
        [key: string]: string | number | boolean | undefined;
    };
    id?: string;
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

    constructor(request: RequestClient) {
        this.request = request
    }

    async getIdFields(objectType: string) {

        interface ObjectField {
            label: string
            name: string
            hasUniqueValue: boolean
        }
        
        interface ObjectFieldsResponse {
            data: {
            results: ObjectField[]
            }
        }

        const fields: ObjectFieldsResponse = await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}`, {
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
                ...fields.data.results
                .filter((field: ObjectField) => field.hasUniqueValue && field.name != 'hs_unique_creation_key')
                .map((field: ObjectField) => {
                    return {
                    label: field.label,
                    value: field.name
                    }
                })
            ]
        }
    }

    async getObjectTypes() {
        const defaultChoices = SUPPORTED_HUBSPOT_OBJECT_TYPES
       
        try {
            const response = await this.request<GetSchemasResponse>(`${HUBSPOT_BASE_URL}/crm/v3/schemas?archived=false`, {
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

    async getAssociationLabel(objectType: string, toObjectType: string) {
        interface AssociationLabel {
            category: AssociationCategory
            typeId: number
            label: string
        }
        interface GetAssociationLabelResponse {
            results: AssociationLabel[]
        }
        
        try {
            const response = await this.request<GetAssociationLabelResponse>(
                `${HUBSPOT_BASE_URL}/crm/v4/associations/${objectType}/${toObjectType}/labels`, {
                    method: 'GET',
                    skipResponseCloning: true
                }
            )
            const choices = response?.data?.results?.map((res) => ({
                label: !res.label ? `${objectType} to ${toObjectType} (Type ${res.typeId})` : `${objectType} to ${toObjectType} ${res.label}`,
                value: `${res.category}:${res.typeId}`
            }))

            return {
                choices
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

    getAssociationType(associationLabel: string): AssociationType {
        const [associationCategory, associationTypeId] = associationLabel.split(':');
        return { associationCategory, associationTypeId } as AssociationType
    }

    async batchObjectRequest(
        action: 'update' | 'create' | 'read', 
        objectType: string,
        data: BatchReadRequestBody | BatchRequestBody
    ) {    
        if(data.inputs.length === 0){
            return null
        }

        return this.request<BatchReadResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`, {
            method: 'POST',
            json: data
        });
    }

    async batchAssociationsRequest(body: BatchAssociationsRequestBody, objectType: string, toObjectType: string){
        if(body.inputs.length === 0){
            return null
        }
        
        return this.request<BatchReadResponse>(`${HUBSPOT_BASE_URL}/crm/v4/associations/${objectType}/${toObjectType}/batch/create`, {
            method: 'POST',
            json: body
        })
    }

    async ensureAssociations(payloads: Payload[]) {
        const [{objectType, toObjectType, associationLabel}] = payloads
        
        if(!objectType || !toObjectType || !associationLabel){
            throw new IntegrationError('Missing required Association fields. Associations require "To Object Type", "To ID Field Name" and "Association Label" fields to be set.','REQUIRED_ASSOCIATION_FIELDS_MISSING',400)
        }
        
        const {associationCategory, associationTypeId} = this.getAssociationType(associationLabel)

        const requestBody: BatchAssociationsRequestBody = {
            inputs: payloads.filter(p => p.recordID && p.toRecordID).map(p => { 
                return {
                    types: [
                        {
                            associationCategory,
                            associationTypeId
                        }
                    ],
                    from: {
                        id: p.recordID as string
                    },
                    to: {
                        id: p.toRecordID as string
                    }
                }
            }) ?? []
        }

        return this.batchAssociationsRequest(requestBody, objectType, toObjectType)
    }

    async ensureObjects(payloads: Payload[], isAssociationObject = false) {

        const [{insertType, associationLabel }] = payloads
        const idFieldName = isAssociationObject ? payloads[0].toIdFieldName : payloads[0].idFieldName
        const objectType = isAssociationObject ? payloads[0].toObjectType : payloads[0].objectType
        const idFieldValueFieldName = isAssociationObject ? 'toIdFieldValue' : 'idFieldValue'
        const recordIdFieldName = isAssociationObject ? 'toRecordID' : 'recordID'

        if( isAssociationObject && (!objectType || !idFieldName || !associationLabel) || (!objectType || !idFieldName) ){
            throw new IntegrationError('Missing required Association fields. Associations require "To Object Type", "To ID Field Name" and "Association Label" fields to be set.','REQUIRED_ASSOCIATION_FIELDS_MISSING',400)
        }

        const readResponse = await this.batchObjectRequest('read', objectType, {
            properties: [idFieldName],
            idProperty: idFieldName,
            inputs: payloads.map(p => { return {id: p[idFieldValueFieldName]}})             
        } as BatchReadRequestBody)
       
        readResponse?.data.results.forEach(result => {
            payloads
                .filter(payload => payload[idFieldValueFieldName] == result.properties[idFieldName] as string)
                .forEach(payload => payload[recordIdFieldName] = result.id )
        })

        const updateRequestBody: BatchRequestBody = {inputs:[]}
        const createRequestBody: BatchRequestBody = {inputs:[]}

        payloads.forEach((payload) => {
            const { stringProperties, numericProperties, booleanProperties, dateProperties } = payload
            const itemPayload: { id?: string | undefined; properties: { [key: string]: string | number | boolean | undefined } } = {
                id: payload[recordIdFieldName] ?? undefined,
                properties: {
                    ...stringProperties, 
                    ...numericProperties, 
                    ...booleanProperties, 
                    ...dateProperties,
                    [idFieldName]: payload[idFieldValueFieldName]
                } as BatchRequestBodyItem['properties']
            } as BatchRequestBodyItem
            if(['update', 'upsert'].includes(insertType) && itemPayload.id){
                updateRequestBody.inputs.push(itemPayload)
            }
            if(['create', 'upsert'].includes(insertType) && !itemPayload.id){
                createRequestBody.inputs.push(itemPayload)
            }
        })
        
        return Promise.all([
            this.batchObjectRequest('update', objectType, updateRequestBody),
            this.batchObjectRequest('create', objectType, createRequestBody)
        ].filter(request => request !== null))
        .then(writeRequests => writeRequests.length > 0 ? writeRequests : null);
    }
}
