import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { createHash } from 'crypto'
import { Settings } from './generated-types'
import { Payload } from './reportConversionEvent/generated-types'

//Custom Data? 

export const event_type: InputField = {
    label: 'Event Type',
    description: "The conversion event type. Please refer to the possible event types in [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters).",
    type: 'string',
    //required: true
    //defualt ? 
}

export const event_conversion_type: InputField = {
    label: "Event Conversion Type",
    description: 'Where the event took place. This must be OFFLINE, WEB, or MOBILE_APP.',
    type: 'string',
    //required: true,
    choices: [
        { label: 'Offline', value: "OFFLINE" },
        { label: 'Web', value: 'WEB' },
        { label: 'Mobile App', value: 'MOBILE_APP' }
    ]
}

export const event_tag: InputField = {
    label: 'Event Tag',
    description: 'Custom event label',
    type: 'string',
    //required: true
    //default event  
}


export const timestamp: InputField = {
    label: 'Event Timestamp',
    description: 'The Epoch timestamp for when the conversion happened.  The timestamp cannot be more than 28 days in the past',
    type: 'string',
    //required: true,
    default: {
        '@path': '$.timestamp'
    }
}

export const email: InputField = {
    label: 'Email',
    description: 'Email address of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat.',
    type: 'string',
    default: {
        '@if': {
            exists: { '@path': '$properties.email' },
            then: { '@path': '$properties.email' },
            else: { '@path': '$traits.email' }
        }
    }
}

export const mobile_ad_id: InputField = {
    label: 'Mobile Ad Indeentifier',
    description: 'Mobile ad identifier (IDFA or AAID) of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat.',
    type: 'string',
    default: {
        '@path': '$context.device.advertisingId'
    }
}

export const uuid_c1: InputField = {
    label: "uuid_c1 Cookie",
    description: 'Unique user ID cookie. If you are using the Pixel SDK, you can access a cookie1 by looking at the _scid value.',
    type: 'string'
}

export const idfv: InputField = {
    label: 'Indentifier for Vendor',
    description: 'IDFV of the user’s device. Segment will normalize and hash this value before sending to Snapchat.',
    type: 'string',
    default: {
        '@path': '$context.device.id'
    }
}

export const phone_number: InputField = {
    label: 'Phone Number',
    description: 'Phone number of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat.',
    type: 'string',
    default: {
        '@if': {
            exists: { '@path': '$properties.phone' },
            then: { '@path': '$properties.phone' },
            else: { '@path': '$traits.phone' }
        }
    }
}

export const user_agent: InputField = {
    label: 'User Agent',
    description: 'User agent from the user’s device.',
    type: 'string',
    default: {
        '@path': '$context.userAgent'
    }
}

export const ip_address: InputField = {
    label: 'IP Address',
    description: 'IP address of the device or browser. Segment will normalize and hash this value before sending to Snapchat.',
    type: 'string',
    default: {
        '@path': '$context.ip'
    }
}

export const item_category: InputField = {
    label: 'Item Category',
    description: 'Category of the item.',
    type: 'string',
    default: {
        '@path': '$properties.category'
    }
}

export const item_ids: InputField = {
    label: 'Item IDs',
    description: 'International Article Number (EAN) when applicable, or other product or category identifier. ',
    type: 'string',
    default: {
        '@path': '$properties.product_id'
    }
}

export const description: InputField = {
    label: 'Description',
    description: 'A string description for additional info.',
    type: 'string'
}

export const number_items: InputField = {
    label: 'Number of Items',
    description: 'Number of items.',
    type: 'string',
    default: {
        '@path': '$properties.quantity'
    }
}

export const price: InputField = {
    label: 'Price',
    description: 'Value of the purchase.',
    type: 'number',
    default: {
        '@if': {
            exists: { '@path': '$properties.price' },
            then: { '@path': '$properties.price' },
            else: { '@path': '$properties.value' }
        }
    }
}

export const currency: InputField = {
    label: 'Currency',
    description: 'Currency for the value specified as ISO 4217 code.',
    type: 'string',
    default: {
        '@path': '$.properties.currency'
    }
}

export const transaction_id: InputField = {
    label: 'Transaction ID',
    description: 'Transaction ID or order ID tied to the conversion event. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.',
    type: 'string',
    default: {
        '@path': '$.properties.order_id'
    }
}

export const level: InputField = {
    label: 'Level',
    description: 'Represents a level in the context of a game.',
    type: 'string',
}

export const client_dedup_id: InputField = {
    label: 'Client Deduplication ID',
    description: 'If you are reporting events via more than one method (Snap Pixel, App Ads Kit, Conversions API) you should use the same client_dedup_id across all methods. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.',
    type: 'string',
}

export const search_string: InputField = {
    label: 'Search String',
    description: 'The text string that was searched for.',
    type: 'string',
    default: {
        '@path': '$.properties.query'
    }
}

export const page_url: InputField = {
    label: 'Page URL',
    description: 'The URL of the web page where the event took place.',
    type: 'string',
    default: {
        '@path': '$.context.page.url'
    }
}

export const sign_up_method: InputField = {
    label: 'Sign Up Method',
    description: 'A string indicating the sign up method.',
    type: 'string'
}

export const hash = (value: string | undefined): string | undefined => {
    if (value === undefined) return

    const hash = createHash('sha256')
    hash.update(value)
    return hash.digest('hex')
}

export const formatPayload = (payload: Payload, settings: Settings): Object => {
    //Normalize fields based on Snapchat Data Hygiene https://marketingapi.snapchat.com/docs/conversion.html#auth-requirements
    if (payload.email) {
        //Removes all leading and trailing whitespace and converts all characters to lowercase. 
        payload.email = payload.email.replace(/\s/g, '').toLowerCase()
    }

    if (payload.phone_number) {
        //Removes all non-numberic characters and leading zeros. 
        payload.phone_number = payload.phone_number.replace(/\D|^0+/g, '')
    }

    if (payload.mobile_ad_id) {
        //Converts all characters to lowercase
        payload.mobile_ad_id = payload.mobile_ad_id.toLowerCase()
    }

    return {
        event_type: payload?.event_type,
        event_conversion_type: payload?.event_conversion_type,
        event_tag: payload?.event_tag,
        timestamp: Date.parse(payload?.timestamp),
        hashed_email: hash(payload?.email),
        mobile_ad_id: hash(payload?.mobile_ad_id),
        uuid_c1: payload?.uuid_c1,
        hashed_idfv: hash(payload?.idfv),
        hashed_phone_number: hash(payload?.phone_number),
        user_agent: payload?.user_agent,
        hashed_ip_address: hash(payload?.ip_address),
        item_category: payload?.item_category,
        item_ids: payload?.item_ids,
        description: payload?.description,
        number_items: payload?.number_items,
        price: payload?.price,
        currency: payload?.currency,
        transaction_id: payload?.transaction_id,
        level: payload?.level,
        client_dedup_id: payload?.client_dedup_id,
        search_string: payload?.search_string,
        page_url: payload?.page_url,
        sign_up_method: payload?.sign_up_method
    }



}

