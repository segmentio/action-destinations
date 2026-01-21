import { RequestClient, MultiStatusResponse, JSONLikeObject, IntegrationError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Subscriber, Unsubscriber, SubscribePayload, UnsubscribePayload, SubscriberMap, UnsubscriberMap } from './types'
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
    const subscribers: SubscriberMap = new Map()
    const unsubscribers: UnsubscriberMap = new Map()

    if(isNaN(listId)){
        payload.forEach((p, index) => {
            handleError("Invalid or missing Segment Audience ID", isBatch, msResponse, index, p, 400)
        })
        return msResponse
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

        if(iterableProjectType === 'userId' && !userId){
            handleError("User ID is required when Iterable Project Type = User ID", isBatch, msResponse, index, p)
            return
        }
        else if(!email && !userId){
            handleError("Either User ID or Email is required when Iterable Project Type = Hybrid", isBatch, msResponse, index, p)
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

    if(subscribers.size > 0){
        const json: SubscribePayload = {
            listId,
            subscribers: Array.from(subscribers.values()),
            ...(typeof updateExistingUsersOnly === 'boolean' ? { updateExistingUsersOnly } : {})
        }
        await sendList(
            request,
            CONSTANTS.SUBSCRIBE,
            json,
            subscribers,
            payload,
            isBatch,
            msResponse,
            'IterableSubscribeError',
            'An error occurred while subscribing users.'
        )
    }

    if(unsubscribers.size > 0){
        const json: UnsubscribePayload = {
            listId,
            subscribers: Array.from(unsubscribers.values()),
            ...(typeof campaignId === 'number' ? { campaignId } : {}),
            ...(typeof channelUnsubscribe === 'boolean' ? { channelUnsubscribe } : {})
        }
        await sendList(
            request,
            CONSTANTS.UNSUBSCRIBE,
            json,
            unsubscribers,
            payload,
            isBatch,
            msResponse,
            'IterableUnsubscribeError',
            'An error occurred while unsubscribing users.'
        )
    }

    if(isBatch){
        return msResponse
    }
}

function handleError(
    message: string,
    isBatch: boolean,
    msResponse: MultiStatusResponse,
    index: number,
    payload: Payload, 
    status = 400,
    json?: Subscriber | Unsubscriber
): void {
    if (!isBatch) {
        throw new PayloadValidationError(message)
    }
    msResponse.setErrorResponseAtIndex(index, {
        status,
        body: payload as unknown as JSONLikeObject,
        ...(typeof json === 'object' ? { sent: json as unknown as JSONLikeObject } : {}),
        errormessage: message
    })
}

async function sendList(
    request: RequestClient,
    endpoint: string,
    json: SubscribePayload | UnsubscribePayload,
    jsonItems: SubscriberMap | UnsubscriberMap,
    payload: Payload[],
    isBatch: boolean,
    msResponse: MultiStatusResponse,
    errorName: string,
    defaultErrorMessage: string
): Promise<void> {
    try {
        await request(`${CONSTANTS.API_BASE_URL}${CONSTANTS.API_CUSTOM_AUDIENCE_ENDPOINT}/${endpoint}`, {
            method: 'post',
            skipResponseCloning: true,
            json
        })
        if (!isBatch) {
            return
        }
        jsonItems.forEach((user, index) => {
            const p = payload[index]
            msResponse.setSuccessResponseAtIndex(index, {
                status: 200,
                body: p as unknown as JSONLikeObject,
                sent: user as unknown as JSONLikeObject
            })
        })
    } 
    catch (error) {
        const status = error?.response?.status as number || 500
        const errormessage = error?.message as string || defaultErrorMessage
        if (!isBatch) {
            throw new IntegrationError(errormessage, errorName, status)
        }
        jsonItems.forEach((jsonItem, index) => {
            const p = payload[index]
            handleError(errormessage, isBatch, msResponse, index, p, status, jsonItem)
        })
    }
}