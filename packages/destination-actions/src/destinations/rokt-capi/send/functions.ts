import { RequestClient, MultiStatusResponse, JSONLikeObject } from '@segment/actions-core'
import { Payload } from './generated-types'
import { URL, BATCH_URL } from './constants'
import { Primitive, JSON, AudienceJSON, EventJSON } from './types'
import { isAlreadyHashed, processHashing } from '../../../lib/hashing-utils'
import { PayloadValidationError } from '@segment/actions-core/*'

export async function send(request: RequestClient, payload: Payload[], isBatch = false) {  
    const url = isBatch ? BATCH_URL : URL
    const msResponse = new MultiStatusResponse()
    const indexToJsonItem: Record<number, JSON> = {}
    
    const json: JSON[] = payload.reduce<JSON[]>((acc, p, index) => {
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
            advertisingId,
            deviceId,
            deviceType
        } = {},
        user_identities: {
            email,
            customerid,
            other2
        } = {}
    } = payload

    if(!(email || customerid || other2 || (advertisingId && deviceType) || (deviceId && deviceType))) {
        return 'At least one of the following is required. Advertising ID, Device ID, Email, Customer ID, ROKT Click ID. If providing advertising ID or Device ID make sure to also include Mobile Device Type.'
    }
}

function buildJSONItem(payload: Payload): JSON {
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
            advertisingId,
            deviceId,
            deviceType
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
            dateofbirth,
            gender,
            ...restUserAttributes
        } = {},
        ip
    } = payload

    const device_info: JSON['device_info'] = {
        ...(http_header_user_agent ? { http_header_user_agent } : {}),
        ...(advertisingId && deviceType && deviceType.toLocaleLowerCase() === 'ios' ? { ios_advertising_id: advertisingId } : {}),
        ...(advertisingId && deviceType && deviceType.toLocaleLowerCase() === 'android' ? { android_advertising_id: advertisingId } : {}),
        ...(deviceId && deviceType && deviceType.toLocaleLowerCase() === 'ios' ? { ios_idfv: deviceId } : {}),
        ...(deviceId && deviceType && deviceType.toLocaleLowerCase() === 'android' ? { android_uuid: deviceId } : {})
    }

    const user_attributes: JSON['user_attributes'] = {
        ...(firstname ? maybeHash(firstname, hashFirstName, 'firstname', 'firstnamesha256', (value) => value.trim()) : {}),
        ...(lastname ? maybeHash(lastname, hashLastName, 'lastname', 'lastnamesha256', (value) => value.trim()) : {}),
        ...(mobile ? maybeHash(mobile, hashMobile, 'mobile', 'mobilesha256', (value) => value.trim()) : {}),
        ...(billingzipcode ? maybeHash(billingzipcode, hashBillingZipcode, 'billingzipcode', 'billingzipsha256', (value) => value.trim()) : {}),
        ...(dateofbirth ? { dateofbirth: new Date(dateofbirth).toISOString().slice(0, 10).replace(/-/g, '')} : {}),
        ...(gender === 'm' || gender === 'f' ? { gender } : {}),
        ...(restUserAttributes && Object.keys(restUserAttributes).length > 0 ? sanitize(restUserAttributes, ['boolean', 'string', 'number'], true) : {})
    }

    const user_identities: JSON['user_identities'] = {
        ...(email ? maybeHash(email, hashEmail, 'email', 'other', (value) => value.toLocaleLowerCase().trim()) : {}),
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
        ...(events && events.length > 0 ? { events } : {}),
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