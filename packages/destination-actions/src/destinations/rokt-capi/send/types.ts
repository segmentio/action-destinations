export type Primitive = string | number | boolean

export interface RoktJSON {
    environment: 'production'
    device_info: {
        http_header_user_agent?: string // user agent from web or mobile 
        ios_advertising_id?: string
        android_advertising_id?: string 
        ios_idfv?: string // ios ID for vendor
        android_uuid?: string // android UUID
    },
    user_attributes: {
        firstname?: string
        lastname?: string
        mobile?: string
        billingzipcode?: string
        firstnamesha256?: string
        lastnamesha256?: string
        mobilesha256?: string
        billingzipsha256?: string
        dob?: string // YYYYMMDD format
        gender?: 'm' | 'f'
        [key: string]: unknown // simple types and arrays only. No objects 
    },
    user_identities: { // at least one required, or android_advertising_id or ios_advertising_id in device_info
        email?: string // This is the raw EMAIL ADDRESS. NO NOT HASH IF UNHASHED. OK to send email and / or other. 
        other?: string // This is the HASHED EMAIL ONLY. 
        customerid?: string // probably maps to Segment userId
        other2?: string // ROKT click id
    },
    integration_attributes?: {
        "1277": {
            passbackconversiontrackingid: string // ROKT click id. Yes, needs to be placed in this duplicate location
        }
    },
    events?: (AudienceJSON | EventJSON)[]
    ip?: string
}

interface BaseEvent {
    event_type: "custom_event"
    data: {
        source_message_id: string
        timestamp_unixtime_ms: number // 13-digit Unix timestamp (ms)
    }
}

export interface AudienceJSON extends BaseEvent {
    data: BaseEvent["data"] & {
        event_name: "audiencemembershipupdate"
        custom_event_type: "other"
        custom_attributes: {
            audience_name: string
            status: 'add' | 'drop'
        }
    }
}

export interface EventJSON extends BaseEvent {
    data: BaseEvent["data"] & {
        event_name: "conversion"
        custom_event_type: "transaction"
        custom_attributes: {
            conversiontype: string     // e.g. "Order Completed"
            confirmationref?: string   // unique conversion ID (e.g. order ID)
            amount?: number
            currency?: string          // ISO 4217 (3-letter)
            [key: string]: unknown     // simple scalar values only
        }
    }
}