import { RequestClient, MultiStatusResponse } from '@segment/actions-core'
import { Payload } from './generated-types'
import { URL, BATCH_URL } from './constants'
import { Primitive, JSON, AudienceJSON, EventJSON } from './types'

export async function send(request: RequestClient, payload: Payload[], isBatch = false) {  
    const url = isBatch ? BATCH_URL : URL
    const msResponse = new MultiStatusResponse()

    const json = buildJSON(payload, isBatch, msResponse)
}

function buildAllJSON(payload: Payload[], isBatch: boolean, msResponse: MultiStatusResponse): JSON[] {
    return payload.map(buildJSONItem)
}

function buildJSONItem(payload: Payload): JSON {
    const {
        hashingConfiguration: {
            hashEmail,
            hashFirstName,
            hashLastName,
            hashMobile,
            hashBillingZipcode,
        } = {},
        device_info: {
            http_header_user_agent,
            advertisingId,
            deviceType,
        } = {},
        user_identities: {
            email,
            customerid,
            other2,
        } = {},
        user_attributes: {
            firstname,
            lastname,
            mobile,
            billingzipcode,
            dateofbirth,
            gender,
            ...restUserAttributes
        } = {},
        ip
    } = payload

    const device_info: JSON['device_info'] = {
        ...(http_header_user_agent ? { http_header_user_agent } : {}),
        ...(advertisingId && deviceType === 'ios' ? { ios_advertising_id: advertisingId } : {}),
        ...(advertisingId && deviceType === 'android' ? { android_advertising_id: advertisingId } : {})
    }

    const user_attributes: JSON['user_attributes'] = {
        ...(firstname ? { maybeHash(firstname, hashFirstName, 'firstname', 'firstnamesha256') } : {}),
        ...(lastname ? { maybeHash(lastname, hashLastName, 'lastname', 'lastnamesha256') } : {}),
        ...(mobile ? { maybeHash(mobile, hashMobile, 'mobile', 'mobilesha256') } : {}),
        ...(billingzipcode ? { maybeHash(billingzipcode, hashBillingZipcode, 'billingzipcode', 'billingzipsha256') } : {}),
        ...(dateofbirth ? { dateofbirth } : {}),
        ...(gender ? { gender } : {}),
        ...(restUserAttributes && Object.keys(restUserAttributes).length > 0 ? sanitize(restUserAttributes, ['boolean', 'string', 'number', 'array']) : {})
    }

    const user_identities: JSON['user_identities'] = {
        ...(email ? { maybeHash(email, hashEmail, 'email', 'other') } : {}),
        ...(customerid ? { customerid } : {}),
        ...(other2 ? { other2 } : {})
    }

    const audienceJSON = getAudienceJSON(payload)
    const eventJSON = getEventJSON(payload)

    const events: JSON['events'] = [
        ...(audienceJSON ? [audienceJSON] : []),
        ...(eventJSON ? [eventJSON] : [])
    ]

    const item: JSON = {
        environment: 'production',
        device_info,
        user_attributes, 
        user_identities, 
        ...(other2 ? { integration_attributes: { "1277": { passbackconversiontrackingid: other2 } } } : {}),
        events,
        ...(ip ? {ip} : {})
    }

    return item
}

function getAudienceJSON(payload: Payload): AudienceJSON | undefined {
    const {
        eventDetails: {
            source_message_id,
            timestamp_unixtime_ms
        },
        audienceDetails: {
            customAudienceName,
            customAudienceMembership
        } = {},
        engageFields: {
            engageAudienceName,
            traitsOrProps,
            computationAction
        } = {}
    } = payload

    const isEngageAudience = Boolean(engageAudienceName && traitsOrProps && computationAction)
    const audienceName: string | undefined = isEngageAudience ? engageAudienceName : customAudienceName
    const membership: boolean | undefined = isEngageAudience && engageAudienceName ? Boolean((traitsOrProps as unknown as Record<string, unknown>)[engageAudienceName]) : customAudienceMembership
    
    if(typeof membership !== 'boolean' || !audienceName) {
        return undefined
    }

    const audienceJSON: AudienceJSON = {
        event_type: "custom_event",
        data: {
            custom_event_type: "transaction",
            source_message_id,
            timestamp_unixtime_ms: new Date(timestamp_unixtime_ms).getTime(), 
            event_name: "audiencemembershipupdate",
            custom_attributes: {
                [audienceName]: membership
            }
        }
    }

    return audienceJSON
}

function getEventJSON(payload: Payload): EventJSON | undefined {
    const {
        eventDetails: {
            conversiontype,
            confirmationref,
            amount,
            currency,
            source_message_id,
            timestamp_unixtime_ms
        },
        eventProperties,
    } = payload

    if(!conversiontype || !confirmationref) {
        return undefined
    }

    const audienceJSON: EventJSON = {
        event_type: "custom_event",
        data: {
            custom_event_type: "transaction",
            source_message_id,
            timestamp_unixtime_ms: new Date(timestamp_unixtime_ms).getTime(), 
            event_name: "conversion",
            custom_attributes: {
                conversiontype,
                confirmationref,
                ...(amount ? { amount } : {}),
                ...(currency ? { currency } : {}),
                ...sanitize(eventProperties, ['number', 'string', 'boolean'], false)
            }
        }
    }

    return audienceJSON
}

function sanitize(obj: Record<string, unknown> | undefined, allowedTypes: ('string' | 'number' | 'boolean')[], allowArrays: boolean): Record<string, Primitive | Primitive[]> | undefined {
    if (!obj) return undefined

    const result: Record<string, Primitive | Primitive[]> = {}

    Object.entries(obj).forEach(([key, value]) => {
        if (allowedTypes.includes(typeof value as 'string' | 'number' | 'boolean')) {
            result[key] = value as Primitive;
        } else if (allowArrays && Array.isArray(value)) {
            const filtered = (value as unknown[]).filter(
                (v): v is Primitive => allowedTypes.includes(typeof v as 'string' | 'number' | 'boolean')
            )
            if (filtered.length) result[key] = filtered
        }
    })

    return result
}