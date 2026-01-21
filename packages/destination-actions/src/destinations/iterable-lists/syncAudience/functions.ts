import { RequestClient, MultiStatusResponse, JSONLikeObject, IntegrationError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Subscriber, Unsubscriber, SubscribePayload, UnsubscribePayload } from './types'
import { PayloadValidationError } from '@segment/actions-core/*'
import { CONSTANTS } from '../constants'

export async function send(request: RequestClient, payload: Payload[], settings: Settings, isBatch: boolean, audienceSettings?: AudienceSettings){
    const { 
        iterableProjectType,
    } = settings    
    const {
        updateExistingUsersOnly,
        channelUnsubscribe,
        campaignId
    } = audienceSettings || {}
    const msResponse: MultiStatusResponse = new MultiStatusResponse()
    const listId = Number(payload[0]?.segmentAudienceId)
    const subscribers: Map<number, Subscriber> = new Map()
    const unsubscribers: Map<number, Unsubscriber> = new Map()

    if(isNaN(listId)){
        if(isBatch){
            payload.forEach((p, index) => {
                msResponse.setErrorResponseAtIndex(index, { 
                    status: 400, 
                    body: p as unknown as JSONLikeObject,
                    errormessage: "Invalid or missing Segment Audience ID"
                })
            })
            return msResponse
        } 
        else {
            throw new PayloadValidationError("Invalid or missing Segment Audience ID")
        }
    }

    payload.map((p, index) => {
        const { 
            email, 
            userId, 
            segmentAudienceKey, 
            traitsOrProperties, 
            dataFields 
        } = p
        
        const action = traitsOrProperties[segmentAudienceKey] 

        if(iterableProjectType === 'userId' && !email){
            const message = "User ID is required when Iterable Project Type = User ID"
            if(!isBatch){
                throw new PayloadValidationError(message)   
            }
            msResponse.setErrorResponseAtIndex(index, { 
                    status: 400, 
                    sent: p as unknown as JSONLikeObject,
                    errormessage: message
            })
            return 
        } 
        else if(!email && !userId){ 
            const message = "Either User ID or Email is required when Iterable Project Type = Hybrid"
            if(!isBatch){
                throw new PayloadValidationError(message)
            }
            msResponse.setErrorResponseAtIndex(index, { 
                status: 400, 
                sent: p as unknown as JSONLikeObject,
                errormessage: message
            })
            return
        }
        
        if(action){
            const subscriber: Subscriber = {
                ...(email ? { email } : {}),
                ...(userId ? { userId } : {}),
                ...(iterableProjectType === 'userId' ? { preferUserId: true } : {}),
                ...(dataFields && Object.entries(dataFields).length > 0 ? { dataFields } : {})
            }
            subscribers.set(index, subscriber)
        } 
        else {
            const unsubscriber: Unsubscriber = {
                ...(email ? { email } : {}),
                ...(userId ? { userId } : {})
            }
            unsubscribers.set(index, unsubscriber)
        }
    })

    if(subscribers.entries.length > 0){
        const json: SubscribePayload = {
            listId,
            subscribers: Array.from(subscribers.values()),
            ...(typeof updateExistingUsersOnly === 'boolean' ? { updateExistingUsersOnly } : {})
        }
        try{
            await request(`${CONSTANTS.API_BASE_URL}/lists/subscribe`, {
                method: 'post',
                skipResponseCloning: true,
                json
            })
            if(!isBatch) {
                return
            }
            subscribers.forEach((subscriber, index) => {
               if(!msResponse.isErrorResponseAtIndex(index)){
                    const p = payload[index]
                    msResponse.setSuccessResponseAtIndex(0, {
                        status: 200,
                        body: p as unknown as JSONLikeObject,
                        sent: subscriber as unknown as JSONLikeObject
                    })
                }
            })
        } 
        catch (error) {
            const status = error?.response?.status as number || 500
            const errormessage = error?.message as string || 'An error occurred while subscribing users.'
            if(!isBatch) {
                throw new IntegrationError(errormessage, 'IterableSubscribeError', status)
            }
            subscribers.forEach((subscriber, index) => {
               if(!msResponse.isErrorResponseAtIndex(index)){
                    const p = payload[index]
                    msResponse.setErrorResponseAtIndex(index, { 
                        status,
                        body: p as unknown as JSONLikeObject,
                        sent: subscriber as unknown as JSONLikeObject,
                        errormessage
                    })
                }
            })
        }
    }

    if(unsubscribers.entries.length > 0){
        const json: UnsubscribePayload = {
            listId,
            subscribers: Array.from(subscribers.values()),
            ...(typeof campaignId === 'number' ? { campaignId } : {}),
            ...(typeof channelUnsubscribe === 'boolean' ? { channelUnsubscribe } : {})
        }
        try{
            await request(`${CONSTANTS.API_BASE_URL}/lists/unsubscribe`, {
                method: 'post',
                skipResponseCloning: true,
                json
            })
            if(!isBatch) {
                return
            }
            unsubscribers.forEach((subscriber, index) => {
               if(!msResponse.isErrorResponseAtIndex(index)){
                    const p = payload[index]
                    msResponse.setSuccessResponseAtIndex(0, {
                        status: 200,
                        body: p as unknown as JSONLikeObject,
                        sent: subscriber as unknown as JSONLikeObject
                    })
                }
            })
        } 
        catch (error) {
            const status = error?.response?.status as number || 500
            const errormessage = error?.message as string || 'An error occurred while unsubscribing users.'
            if(!isBatch) {
                throw new IntegrationError(errormessage, 'IterableSubscribeError', status)
            }
            unsubscribers.forEach((subscriber, index) => {
               if(!msResponse.isErrorResponseAtIndex(index)){
                    const p = payload[index]
                    msResponse.setErrorResponseAtIndex(index, { 
                        status,
                        body: p as unknown as JSONLikeObject,
                        sent: subscriber as unknown as JSONLikeObject,
                        errormessage
                    })
                }
            })
        }
    }

    if(isBatch){
        return msResponse
    }
}