import { RequestClient } from '@segment/actions-core'
import type { AttributionEvent, BaseEvent, Page, Screen, Track, Group, Alias, Identify } from './types'
import { Payload } from "./generated-types"

export function send(request: RequestClient, payload: Payload) {
    const { 
        messageId, 
        timestamp, 
        type,
        event,
        name,
        properties,
        traits,
        userId,
        anonymousId,
        groupId,
        context,
        previousId
    } = payload

    const baseJSON: BaseEvent = {
        messageId, 
        timestamp, 
        ...(userId && { userId }),
        ...(anonymousId && { anonymousId }),
        ...(context && { context })
    }

    if(type === 'track') {
        const trackJSON: Track = {
            ...baseJSON,
            type: 'track',
            event: event as string,
            ...(properties && { properties }),
            ...(traits && { traits })
        }
        send(request, trackJSON)
    } 
    else if(type === 'page' || type === 'screen') {
        const pageOrScreenJSON: Page | Screen = {
            ...baseJSON,
            type,
            ...(name && { name }),
            ...(properties && { properties }),
            ...(traits && { traits })
        }
        send(request, pageOrScreenJSON)
    } 
    else if(type === 'identify') {
        const identifyJSON: Identify = {
            ...baseJSON,
            type,
            ...(traits && { traits })
        }
        send(request, identifyJSON)
    }
    else if (type === 'group') {
        const groupJSON: Group = {
            ...baseJSON,
            type,
            ...(groupId && { groupId }),
            ...(traits && { traits })
        }
        send(request, groupJSON)
    } else if (type === 'alias') {
        const aliasJSON: Alias = {
            ...baseJSON,
            type,
            userId: userId as string,
            ...(previousId && { previousId }),
            ...(traits && { traits })
        }
        send(request, aliasJSON)
    }
}

export function sendJSON(request: RequestClient, json: AttributionEvent) {
    const { type } = json
    const url = `https://track.attributionapp.com/v1/${type[0]}`
    return request(url, {
        method: 'POST',
        json
    })
}