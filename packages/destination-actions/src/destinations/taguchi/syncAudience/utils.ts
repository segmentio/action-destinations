import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { RequestClient, PayloadValidationError, MultiStatusResponse, JSONLikeObject } from '@segment/actions-core'
import { JSON, JSONItem, ResponseJSON } from './types'

export function validate(payloads: Payload[]): Payload[]{
    if (payloads.length === 1) {
        const p = payloads[0]
        if (!p.identifiers || Object.keys(p.identifiers).length === 0) {
            throw new PayloadValidationError('At least one identifier is required.')
        }
    }
    return payloads
}

export async function send(request: RequestClient, payloads: Payload[], settings: Settings, isBatch: boolean) {

    validate(payloads)
  
    const json: JSON = payloads.map(payload => buildJSON(payload, settings.organizationId))

    const response = await request<ResponseJSON>(`${settings.integrationURL}/subscriber`, {
        method: 'POST',
        json,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
        }
    })

    if(isBatch){
        const multiStatusResponse = new MultiStatusResponse()
        response.data.forEach((res, index) => {
            if (res.code >= 200 && res.code < 300) {
                multiStatusResponse.setSuccessResponseAtIndex(index, {
                    status: res.code,
                    sent: json[index] as unknown as JSONLikeObject,
                    body: res as unknown as JSONLikeObject
                });
            } else {
                multiStatusResponse.setErrorResponseAtIndex(index, {
                    status: res.code,
                    sent: json[index] as unknown as JSONLikeObject,
                    body: res as unknown as JSONLikeObject,
                    errormessage: res.description
                })
            }
        })
        return multiStatusResponse
    }
    
    return response 
}

function buildJSON(payload: Payload, organizationId: string): JSONItem {
    const { 
        identifiers, 
        traits: { 
            title, 
            firstname, 
            lastname, 
            dob, 
            address, 
            address2, 
            address3, 
            suburb, 
            state, 
            country, 
            postcode, 
            gender, 
            ...customTraits 
        } = {}
    } = payload

    const json: JSONItem = {
        profile: {
            organizationId: Number(organizationId),
            ...identifiers,
            ...buildCustom(customTraits),
            ...buildLists(payload)
        }
    }
    return json
}

function buildCustom(customTraits: Payload['traits']): JSONItem['profile']['custom'] | undefined {
    if (customTraits && Object.keys(customTraits).length === 0) {
        return {
            custom: customTraits
        }
    }
    return undefined 
}

function buildLists(payload: Payload): JSONItem['profile']['lists'] | undefined {
    const lists = []

    if (payload.subscribeLists && payload.subscribeLists.length > 0) {
        lists.push(...payload.subscribeLists.map(list => ({
            listId: Number(list),
            subscribedTimestamp: payload.timestamp,
            subscriptionOption: null
        })))
    }

    if (payload.unsubscribeLists && payload.unsubscribeLists.length > 0) {
        lists.push(...payload.unsubscribeLists.map(list => ({
            listId: Number(list),
            unsubscribedTimestamp: payload.timestamp,
            subscriptionOption: null
        })))
    }

    return lists.length > 0 ? lists : undefined
}