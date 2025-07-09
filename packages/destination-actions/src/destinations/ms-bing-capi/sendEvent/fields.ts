import { InputField } from '@segment/actions-core'
import { getCurrencyChoices } from './utils' 

export const data: InputField = {
    label: 'Data',
    description: 'TODO - description for this field',
    type: 'object',
    required: true,
    properties: {
        eventType: {
            label: 'Event Type',
            description: 'The type of event being sent to the Bing API.',
            type: 'string',
            required: true,
            choices: [
            { label: 'Page Load', value: 'pageLoad' },
            { label: 'Custom', value: 'custom' }
            ]
        },
        eventId: {
            label: 'Event ID',
            description: 'EventID for deduplication. Defaults to the Segment messageId.',
            type: 'string'
        },
        eventName: {
            label: 'Event Name',
            description: 'Event action for custom conversion goals, if used.',
            type: 'string'
        },
        eventTime: {
            label: 'Event Time',
            description: 'The time the event occurred.',
            type: 'string',
            format: 'date-time',
            required: true
        },
        eventSourceUrl: {
            label: 'Event Source URL',
            description: 'URL of the page, used for example: “destination URL” goals. Required for pageLoad events.',
            type: 'string',
            required: {
                conditions: [{ fieldKey: 'eventDetails.eventType', operator: 'is', value: 'pageLoad' }]
            }
        },
        pageLoadId: {
            label: 'Page Load ID',
            description: 'Page load id that links to 0+ custom events from the same page. Format as a v4 UUID. ',
            type: 'string'
        },
        referrerUrl: {
            label: 'Referrer URL',
            description: 'Referrer of the page, used for example: "referral" remarketing lists.',
            type: 'string'
        },
        pageTitle: {
            label: 'Page Title',
            description: 'Title of the page.',
            type: 'string'
        },
        keywords: {
            label: 'Keywords',
            description: 'Page keywords - SEO meta keyworls.',
            type: 'string'
        }
    },
    default: {
        eventType: { '@path': '$.properties.event_type' },
        eventId: { '@path': '$.messageId' },
        eventName: { '@path': '$.event' },
        eventTime: { '@path': '$.timestamp' },
        eventSourceUrl: { '@path': '$.context.page.url' },
        pageLoadId:  { '@path': '$.properties.page_load_id' },
        referrerUrl: { '@path': '$.context.page.referrer' },
        pageTitle: { '@path': '$.context.page.title' },
        keywords: { '@path': '$.properties.keywords' }
    }
}

export const userData: InputField = {
    label: 'User Data',
    description: 'A list of user identifiers associated with the event.',
    type: 'object',
    required: true,
    properties: {
        clientUserAgent: {
            label: 'Client User Agent',
            description: 'User agent string of the client device.',
            type: 'string'
        },
        anonymousId: {
            label: 'Anonymous ID',
            description: 'Guest user anonymous ID.',
            type: 'string'
        },
        externalId: {
            label: 'External ID',
            description: 'Authenticated user id (anonymized) if user is logged in. Also used for ID sync',  
            type: 'string'
        },
        em: {
            label: 'Email',
            description: 'Email address of the user. Accepts a clear text or hashed email address. Segment will ensure the email address is hashed before sending to Bing Ads.',
            type: 'string',
            format: 'email'
        },
        ph: {
            label: 'Phone',
            description: 'Phone number of the user. Accepts a clear text or hashed phone number. Segment will ensure the phone number is hashed before sending to Bing Ads.',
            type: 'string'
        },
        clientIpAddress: {
            label: 'Client IP Address',
            description: 'IP address of the client device.',
            type: 'string'
        },
        msclkid: {
            label: 'MSCLKID',
            description: 'Microsoft Last Click ID.',
            type: 'string'
        }
    },
    default: {
        clientUserAgent: { '@path': '$.context.userAgent' },
        anonymousId: { '@path': '$.anonymousId' },
        externalId: { '@path': '$.userId' },
        em: { 
            '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
            }
        },
        ph: { 
            '@if': {
            exists: { '@path': '$.context.traits.phone' },
            then: { '@path': '$.context.traits.phone' },
            else: { '@path': '$.properties.phone' }
            }
        },
        clientIpAddress: { '@path': '$.context.ip' },
        msclkid: { 
            '@if': {
            exists: { '@path': '$.properties.msclkid' },
            then: { '@path': '$.properties.msclkid' },
            else: { '@path': '$.integrations.Ms Bing Capi.msclkid' }
            }
        }
    }
}

export const customData: InputField = {
    label: 'Custom Data',
    description: 'Custom data to be sent to the Bing API. This can include additional properties that are not covered by the standard fields.',
    type: 'object',
    properties: {
        eventCategory: {
            label: 'Event Category',
            description: 'The category for custom conversion goals, if used.',
            type: 'string'
        },
        eventLabel: {
            label: 'Event Label',
            description: 'The label for custom conversion goals.',
            type: 'string'
        },
        eventValue: {
            label: 'Event Value',
            description: 'The event value for custom conversion goals.',
            type: 'number'
        },
        searchTerm: {
            label: 'Search Term',
            description: 'The query used by the user for a search results page.',
            type: 'string'
        },
        transactionId: {
            label: 'Transaction ID',
            description: 'The unique identifier for the transaction. Required for purchase events.',
            type: 'string' 
        },
        value: {
            label: 'Value',
            description: 'Revenue value (float) to report variable revenue for goals, if used',
            type: 'number'
        },
        currency: {
            label: 'Currency',
            description: 'The currency of the event value, in ISO 4217 format.',
            type: 'string',
            choices: getCurrencyChoices() 
        },
        itemIds: {
            label: 'Item IDs',
            description: 'A comma separated list of product IDs, or an array of IDs.',
            type: 'string',
            multiple: true
        },
        pageType: {
            label: 'Page Type',
            description: 'The type of page where the event occurred.',
            type: 'string',
            choices: [
                { label: 'Home', value: 'home' },
                { label: 'Product', value: 'product' },
                { label: 'Category', value: 'category' },
                { label: 'Search Results', value: 'searchresults' },
                { label: 'Cart', value: 'cart' },
                { label: 'Purchase', value: 'purchase' },
                { label: 'Other', value: 'other' }
            ]
        },
        ecommTotalValue: {
            label: 'Ecomm Total Value',
            description: 'Total value of the cart of purchase.',
            type: 'number'
        },
        ecommCategory: {
            label: 'Ecomm Category',
            description: 'Category ID',
            type: 'string'
        }
    },
    default: {
        eventCategory: { '@path': '$.properties.event_category' }, // ?? is this the correct default mapping?
        eventLabel: { '@path': '$.properties.event_label' },
        eventValue: { '@path': '$.properties.value' },
        searchTerm: { '@path': '$.properties.query' },
        transactionId: { '@path': '$.properties.order_id' },
        value: { '@path': '$.properties.value' },  // TODO - does this need a default?
        currency: { '@path': '$.properties.currency'},
        itemIds: { '@path': '$.properties.item_ids' },
        pageType: { '@path': '$.properties.page_type' },
        ecommTotalValue: { '@path': '$.properties.ecomm_total_value' },
        ecommCategory: { '@path': '$.properties.ecomm_category' }
    }
}

export const items: InputField = {
    label: 'Items',
    description: 'The list of items associated with the event. Must contain at least one item.',
    type: 'object',
    multiple: true,
    required: false,
    properties: {
    id: {
        label: 'Item ID',
        description: 'The unique identifier for the item.',
        type: 'string',
        required: true
    },
    name: {
        label: 'Item Name',
        description: 'The name of the item.',
        type: 'string',
        required: true
    },
    price: {
        label: 'Item Price',
        description: 'The price of the item, after discounts.',
        type: 'integer',
        required: true
    },
    quantity: {
        label: 'Item Quantity',
        description: 'The quantity of the item.',
        type: 'integer',
        required: true
    }
    },
    default: {
    '@arrayPath': [
        '$.properties.products',
        {
        id: { '@path': '$.id' },
        name: { '@path': '$.name' },
        quantity: { '@path': '$.quantity' },
        item_price: { '@path': '$.price' }
        }
    ]
    }
}

export const hotelData: InputField = {
    label: 'Hotel Data',
    description: 'Data specific to hotel events.',
    type: 'object',
    properties: {
        totalPrice: {
            label: 'Total Price',
            description: 'The total price of the hotel stay.',
            type: 'integer' // TODO - check if this should be a float
        }
    
    
    },
    default: {
        totalPrice: { '@path': '$.properties.hotel_total_price' }
    }
}

