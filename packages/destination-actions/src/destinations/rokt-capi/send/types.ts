
export interface JSON {
    environment: 'production',
    device_info: {
        http_header_user_agent?: string, // user agent from web or mobile 
        ios_advertising_id?: string, 
        android_advertising_id?: string 
    },
    user_attributes: {
        firstname?: string,
        lastname?: string,
        mobile?: string,
        billingzipcode: string,
        firstnamesha256?: string,
        lastnamesha256?: string,
        mobilesha256?: string,
        billingzipsha256?: string
        dateofbirth?: string, // YYYYMMDD format
        gender: 'm' | 'f'
        [key: string]: unknown // simple types and arrays only. No objects 
    },
    user_identities: { // at least one required, or android_advertising_id or ios_advertising_id in device_info
        email?: string, // preferable 
        other?: string // hashed email only. No other identfiier permitted here. 
        customerid?: string // probably maps to Segment userId
        other2?: string // ROKT click id
    },
    integration_attributes?: {
        "1277": {
            passbackconversiontrackingid: string // rcid - this is the Rokt Click ID from the browser
        }
    },
    events: [ // can contain up to 100
        {
            // Send an item like this for an audience update
            data: {
                event_name: "audiencemembershipupdate", // for audience only
                custom_event_type: "transaction", // always transaction 
                source_message_id: string, // maps to Segment messageId
                timestamp_unixtime_ms: number, // 13 char unix timestamp in milliseconds
                custom_attributes: {
                    audiencename: string, // name of the audience
                    audiencemembership: boolean
                }
            }
            event_type: "custom_event"
        },
        {
            data: {
                // Send an item like this for a regular conversion event
                event_name: "conversion", // always the word conversion
                custom_event_type: "transaction", // always transaction 
                source_message_id: string, // maps to Segment messageId
                timestamp_unixtime_ms: number, // 13 char unix timestamp in milliseconds
                custom_attributes: {
                    conversiontype: string, // Segment event name. e.g. "Order Completed"
                    confirmationref: string, // Unique ID for the conversion. Ideally an order id.
                    amount?: number,
                    currency?: string // 3 letter ISO currency code
                    [key: string]: unknown // simple types. No arrays. No objects 
                }
            },
            event_type: "custom_event"
        }
    ],
    ip?: string
}