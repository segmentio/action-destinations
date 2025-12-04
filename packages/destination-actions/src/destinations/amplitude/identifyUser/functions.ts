import { Payload as IdentifyUserPayload} from './generated-types'
import { RequestClient, omit } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { getEndpointByRegion, getUserProperties, parseUserAgentProperties } from '../common-functions'
import { AmplitudeProfileJSON } from './types'
import { KEYS_TO_OMIT } from './constants'

export function send(request: RequestClient, payload: IdentifyUserPayload, settings: Settings) {
    const {
        userAgent,
        userAgentParsing,
        includeRawUserAgent,
        userAgentData,
        min_id_length,
        platform,
        library,
        user_id,
        ...rest
    } = omit(payload, KEYS_TO_OMIT)

    const user_properties = getUserProperties(payload)

    const event: AmplitudeProfileJSON = {
        ...(userAgentParsing && parseUserAgentProperties(userAgent, userAgentData)),
        ...(includeRawUserAgent && { user_agent: userAgent }),
        ...rest,
        ...{ user_id: user_id || null },
        ...(platform ? { platform: platform.replace(/ios/i, 'iOS').replace(/android/i, 'Android') } : {}),
        ...(library === 'analytics.js' && !platform ? { platform: 'Web' } : {}),   
        ...(user_properties ? { user_properties } : {}),
        library: 'segment'
    }

    const url = getEndpointByRegion('identify', settings.endpoint)

    const body = new URLSearchParams()
    body.set('api_key', settings.apiKey)
    body.set('identification', JSON.stringify(event))
    if (typeof min_id_length === 'number' && min_id_length > 0) {
        body.set('options', JSON.stringify({ min_id_length }) )
    }

    return request(url, {
        method: 'post',
        body
    })    
}