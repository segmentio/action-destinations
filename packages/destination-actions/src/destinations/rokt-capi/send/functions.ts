import { RequestClient, MultiStatusResponse, JSONLikeObject, PayloadValidationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { URL, BATCH_URL } from './constants'
import { Primitive, RoktJSON, AudienceJSON, EventJSON } from './types'
import { isAlreadyHashed, processHashing } from '../../../lib/hashing-utils'

export async function send(request: RequestClient, payload: Payload[], isBatch = false) {  
    const url = isBatch ? BATCH_URL : URL
    const msResponse = new MultiStatusResponse()
    const indexToJsonItem: Record<number, RoktJSON> = {}
    
    const json: RoktJSON[] = payload.reduce<RoktJSON[]>((acc, p, index) => {
        const error = validate(p)
        if(error) {
            if(!isBatch){
                throw new PayloadValidationError(error)
            }
            msResponse.setErrorResponseAtIndex(index, {
                status: 400,
                errortype: 'PAYLOAD_VALIDATION_FAILED',
                errormessage: error,
                sent: payload as unknown as JSONLikeObject
            })
        } 
        else {
            const jsonItem = buildJSONItem(p)
            indexToJsonItem[index] = jsonItem
            msResponse.setSuccessResponseAtIndex(index, {
                status: 200,
                sent: jsonItem as unknown as JSONLikeObject,
                body: JSON.stringify(p)
            })
            acc.push(jsonItem)
        }
        return acc
    }, [])

    if(json.length > 0) {
        try {
            await request(url, {
                method: 'POST',
                json: isBatch ? json : json[0]
            })
            if(isBatch) {
                return msResponse
            } 
        } 
        catch(error) {
            if(!isBatch) {
                throw error
            }
            payload.forEach((p, index) => {
                if(msResponse.isErrorResponseAtIndex(index)) {
                    msResponse.setErrorResponseAtIndex(index, {
                        status: error.response.status,
                        errormessage: error.message,
                        sent: indexToJsonItem[index] as unknown as JSONLikeObject || {},
                        body: JSON.stringify(p)
                    })
                }
            })
        }
    }

    if (isBatch) { 
        return msResponse 
    }
}

function validate(payload: Payload): string | undefined {
    const {
        device_info: {
            ios_advertising_id,
            android_advertising_id,
            ios_idfv, 
            android_uuid
        } = {},
        user_identities: {
            email,
            customerid,
            other2
        } = {}
    } = payload

    if(!(email || customerid || other2 || ios_advertising_id || android_advertising_id || ios_idfv || android_uuid)) {
        return 'At least one of the following is required: iOS Advertising ID, Android Advertising ID, iOS ID for Vendor, Android UUID, Email, Customer ID, ROKT Click ID.'
    }
}

function buildJSONItem(payload: Payload): RoktJSON {
    const {
        hashingConfiguration: {
            hashEmail,
            hashFirstName,
            hashLastName,
            hashMobile,
            hashBillingZipcode
        } = {},
        device_info: {
            http_header_user_agent,
            ios_advertising_id,
            android_advertising_id,
            ios_idfv, 
            android_uuid
        } = {},
        user_identities: {
            email,
            customerid,
            other2
        } = {},
        user_attributes: {
            firstname,
            lastname,
            mobile,
            billingzipcode,
            dob,
            gender,
            ...restUserAttributes
        } = {},
        ip, 
        rtid
    } = payload

    const device_info: RoktJSON['device_info'] = {
        ...(http_header_user_agent ? { http_header_user_agent } : {}),
        ...(ios_advertising_id ? { ios_advertising_id } : {}),
        ...(android_advertising_id ? { android_advertising_id } : {}),
        ...(ios_idfv ? { ios_idfv } : {}),
        ...(android_uuid ? { android_uuid } : {})
    }

    const user_identities: RoktJSON['user_identities'] = {
        ...(email ? maybeHash(email, hashEmail, 'email', 'other', (value) => value.toLocaleLowerCase().trim()) : {}),
        ...(customerid ? { customerid } : {}),
        ...(other2 ? { other2 } : {})
    }

    const audienceJSON = getAudienceJSON(payload)
    const eventJSON = getEventJSON(payload)

    const events: RoktJSON['events'] = [
        ...(audienceJSON ? [audienceJSON] : []),
        ...(eventJSON ? [eventJSON] : [])
    ]

    const { audience_name, status } = audienceJSON?.data?.custom_attributes || {}

    const user_attributes: RoktJSON['user_attributes'] = {
        ...(firstname ? maybeHash(firstname, hashFirstName, 'firstname', 'firstnamesha256', (value) => value.trim()) : {}),
        ...(lastname ? maybeHash(lastname, hashLastName, 'lastname', 'lastnamesha256', (value) => value.trim()) : {}),
        ...(mobile ? maybeHash(mobile, hashMobile, 'mobile', 'mobilesha256', (value) => value.trim()) : {}),
        ...(billingzipcode ? maybeHash(billingzipcode, hashBillingZipcode, 'billingzipcode', 'billingzipsha256', (value) => value.trim()) : {}),
        ...(dob ? { dob: new Date(dob).toISOString().slice(0, 10).replace(/-/g, '')} : {}),
        ...(gender === 'm' || gender === 'f' ? { gender } : {}),
        ...(restUserAttributes && Object.keys(restUserAttributes).length > 0 ? sanitize(restUserAttributes, ['boolean', 'string', 'number'], true) : {}),
        ...(audience_name && status ? { [`segment_${audience_name}`]: status === 'add' } : {})
    }

    const integration_attributes: RoktJSON['integration_attributes'] = {
        ["1277"]: {
            passbackconversiontrackingid: rtid || ''
        }
    }

    const item: RoktJSON = {
        environment: 'production',
        device_info,
        user_attributes, 
        user_identities, 
        ...(other2 ? { integration_attributes: { "1277": { passbackconversiontrackingid: other2 } } } : {}),
        ...(events && events.length > 0 ? { events } : {}),
        ...(ip ? {ip} : {}),
        ...(rtid ? { integration_attributes } : {})
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
                audience_name: audienceName,
                status: membership ? 'add' : 'drop'
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

    const eventJSON: EventJSON = {
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
    return eventJSON
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

function maybeHash(value: string | undefined, shouldHash: boolean | undefined, key: string, hashedKey: string, cleaningFunction?: (input: string) => string): Record<string, string> {
  if (!value) {
    return {}
  } 

  const isHashed = isAlreadyHashed(value, 'sha256', 'hex')
  
  if(isHashed) {
    return { 
        [hashedKey]: value 
    }
  } 
  else if (typeof shouldHash === 'boolean' && shouldHash) {
    const hashedValue = processHashing(value, 'sha256', 'hex', cleaningFunction)
    return { 
        [hashedKey]: hashedValue 
    }
  }
  else {
    return { [key]: cleaningFunction ? cleaningFunction(value) : value }
  }
}