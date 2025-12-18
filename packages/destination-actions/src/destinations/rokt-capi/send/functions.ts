import { RequestClient, MultiStatusResponse } from '@segment/actions-core'
import { Payload } from './generated-types'
import { URL, BATCH_URL } from './constants'
import { JSON } from './types'
import { rest } from 'lodash'

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
        eventDetails: {
            conversiontype,
            confirmationref,
            amount,
            currency,
            source_message_id,
            timestamp_unixtime_ms,
        } = {},
        eventProperties,
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
        ip,
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
        ...(restUserAttributes && Object.keys(restUserAttributes).length > 0 ? sanitize(restUserAttributes) : {})
    }

    const user_identities: JSON['user_identities'] = {
        ...(email ? { maybeHash(email, hashEmail, 'email', 'other') } : {}),
        ...(customerid ? { customerid } : {}),
        ...(other2 ? { other2 } : {})
    }

    const events: JSON['events'] = []
    const audienceEvent = {}

    const item: JSON = {
        environment: 'production',
        device_info,
        user_attributes, 
        user_identities, 
        ...(other2 ? { integration_attributes: { "1277": { passbackconversiontrackingid: other2 } } } : {}),
        ...(ip ? {ip} : {}),
    }

    return item
}