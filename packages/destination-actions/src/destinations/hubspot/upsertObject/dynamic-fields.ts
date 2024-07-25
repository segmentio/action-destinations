import { RequestClient } from '@segment/actions-core'
import { HubSpotError } from '../errors'
import { HUBSPOT_BASE_URL } from '../properties'
import { SUPPORTED_HUBSPOT_OBJECT_TYPES } from './constants'

import { DynamicFieldResponse } from '@segment/actions-core'

enum AssociationCategory {
    HUBSPOT_DEFINED = 'HUBSPOT_DEFINED',
    USER_DEFINED = 'USER_DEFINED',
    INTEGRATOR_DEFINED = 'INTEGRATOR_DEFINED'
}

export async function dynamicReadIdFields(request: RequestClient, objectType: string) {

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
        const response: ResponseType = await request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}`, {
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

export async function dynamicReadPropertyGroups(request: RequestClient, objectType: string): Promise<DynamicFieldResponse> {
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
        const response: ResponseType = await request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}/groups`, {
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

export async function dynamicReadAssociationLabels(request: RequestClient, fromObjectType: string, toObjectType: string): Promise<DynamicFieldResponse> {
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
        const response: ResponseType = await request(`${HUBSPOT_BASE_URL}/crm/v4/associations/${fromObjectType}/${toObjectType}/labels`, {
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

export async function dynamicReadObjectTypes(request: RequestClient): Promise<DynamicFieldResponse> {
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
        const response: ResponseType = await request(`${HUBSPOT_BASE_URL}/crm/v3/schemas?archived=false`, {
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