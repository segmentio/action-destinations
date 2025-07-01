import type { InputField } from '@segment/actions-core'
import { ACTION_SOURCES } from './types'

export const eventName: InputField = {
    label: 'Event Name',
    description: 'The name of the event to be sent to Facebook Conversions API. This should match the event name used in your Facebook Pixel implementation.',
    type: 'string',
    choices: [
        { label: 'Custom Event', value: 'CustomEvent' },
        { label: 'Add Payment Info', value: 'AddPaymentInfo' },
        { label: 'Add To Cart', value: 'AddToCart' },
        { label: 'Add To Wishlist', value: 'AddToWishlist' },
        { label: 'Complete Registration', value: 'CompleteRegistration' },
        { label: 'Contact', value: 'Contact' },
        { label: 'Customize Product', value: 'CustomizeProduct' },
        { label: 'Donate', value: 'Donate' },
        { label: 'Find Location', value: 'FindLocation' },
        { label: 'Initiate Checkout', value: 'InitiateCheckout' },
        { label: 'Lead', value: 'Lead' },
        { label: 'Purchase', value: 'Purchase' },
        { label: 'Schedule', value: 'Schedule' },
        { label: 'Search', value: 'Search' },
        { label: 'Start Trial', value: 'StartTrial' },
        { label: 'Submit Application', value: 'SubmitApplication' },
        { label: 'Subscribe', value: 'Subscribe' },
        { label: 'View Content', value: 'ViewContent' }
    ],
    default: 'CustomEvent',
}

export const content_category: InputField = {
    label: 'Content Category',
    description: 'The category of the content associated with the event.',
    type: 'string',
    default: { '@path': '$.properties.category' }
}

export const content_ids: InputField = {
    label: 'Content IDs',
    description: "Product IDs associated with the event, such as SKUs (e.g. ['ABC123', 'XYZ789']). Accepts a single string value or array of strings.",
    type: 'string',
    multiple: true
}

export const content_name: InputField = {
    label: 'Content Name',
    description: 'The name of the page or product associated with the event.',
    type: 'string',
    default: { '@path': '$.properties.name' }
}

export const content_type: InputField = {
    label: 'Content Type',
    description:
        'If the IDs being passed in content_ids or contents parameter are IDs of products, then the value should be product. If product group IDs are being passed, then the value should be product_group. If no content_type is provided, Meta will match the event to every item that has the same ID, independent of its type.',
    type: 'string',
    choices: [
        { value: 'product', label: 'Product' },
        { value: 'product_group', label: 'Product Group' }
    ]
}

export const contents: InputField = {
  label: 'Contents',
  description:
    'A list of JSON objects that contain the product IDs associated with the event plus information about the products. ID and quantity are required fields.',
  type: 'object',
  multiple: true,
  additionalProperties: true,
  properties: {
    id: {
      label: 'ID',
      description: 'The product ID of the purchased item.',
      type: 'string',
      required: true
    },
    quantity: {
      label: 'Quantity',
      description: 'The number of items purchased.',
      type: 'integer',
      required: true
    },
    item_price: {
      label: 'Item Price',
      description: 'The price of the item.',
      type: 'number'
    }
  }
}

export const currency: InputField = {
    label: 'Currency',
    description: 'The currency for the value specified. Currency must be a valid ISO 4217 three-digit currency code.',
    type: 'string',
    default: { '@path': '$.properties.currency' }
}

export const delivery_category: InputField = {
    label: 'Delivery Category',
    description: 'Category of the delivery',
    type: 'string',
    choices: [
        { value: 'in_store', label: 'In Store' },
        { value: 'curbside', label: 'Curbside' },
        { value: 'home_delivery', label: 'Home Delivery' }
    ],
    default: 'home_delivery'
}

export const num_items: InputField = {
    label: 'Number of Items',
    description: 'The number of items when checkout was initiated.',
    type: 'integer',
    default: { '@path': '$.properties.quantity' }  
}

export const predicted_ltv: InputField = {
    label: 'Predicted LTV',
    description: 'Predicted lifetime value of a subscriber as defined by the advertiser and expressed as an exact value.',
    type: 'number'
}

export const search_string: InputField = {
    label: 'Search String',
    description: 'The string entered by the user for the search.',
    type: 'string',
    default: { '@path': '$.properties.query' }
}

export const status: InputField = {
    label: 'Registration Status',
    description: 'The status of the registration. true for completed registrations, false otherwise.',
    type: 'boolean'
}

export const value: InputField = {
    label: 'Value',
    description: 'A numeric value associated with this event. This could be a monetary value or a value in some other metric.',
    type: 'number'
}

export const custom_data: InputField = {
    label: 'Custom Data',
    description: 'The custom data object can be used to pass custom properties.',
    type: 'object',
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
}

export const eventID: InputField = {
    label: 'Event ID',
    description: 'This ID can be any unique string. Event ID is used to deduplicate events sent by both Facebook Pixel and Conversions API.',
    type: 'string',
    default: { '@path': '$.messageId' }
}

export const eventSourceUrl: InputField = {
    label: 'Event Source URL',
    description: 'The URL of the page where the event occurred. Can be used to override the default URL taken from the current page.',
    type: 'string',
    default: { '@path': '$.context.page.url' }
}

export const actionSource: InputField = {
  label: 'Action Source',
  description: 'The source of the event. This can be used to specify where the event originated from.',
  type: 'string',
  choices: [
    { label: 'Email', value: ACTION_SOURCES.email },
    { label: 'Website', value: ACTION_SOURCES.website },
    { label: 'App', value: ACTION_SOURCES.app },
    { label: 'Phone Call', value: ACTION_SOURCES.phone_call },
    { label: 'Chat', value: ACTION_SOURCES.chat },
    { label: 'Physical Store', value: ACTION_SOURCES.physical_store },
    { label: 'System Generated', value: ACTION_SOURCES.system_generated },
    { label: 'Other', value: ACTION_SOURCES.other }
  ],
  default: ACTION_SOURCES.website
}

export const userData: InputField = {
    label: 'User Data',
    description: 'User data to be sent with the event. This can include hashed identifiers like email, phone number, etc.',
    type: 'object',
    properties: {
        external_id: {
            label: 'External ID',
            description: 'A unique identifier for the user from your system',
            type: 'string'
        },
        em: {
            label: 'Email',
            description: 'Email address of the user',
            type: 'string',
            format: 'email'
        },
        ph: {
            label: 'Phone Number',
            description: 'Phone number of the user',
            type: 'string'
        },
        fn: {
            label: 'First Name',
            description: 'First name of the user',
            type: 'string'  
        },
        ln: {
            label: 'Last Name',
            description: 'Last name of the user',
            type: 'string'
        },
        ge: {
            label: 'Gender',
            description: 'Gender of the user. If unknown leave blank.',
            type: 'string',
            choices: [
                { label: 'Male', value: 'm' },
                { label: 'Female', value: 'f' }
            ]
        },
        db: {
            label: 'Date of Birth',
            description: 'Date of birth of the user',
            type: 'string'
        },
        ct: {
            label: 'City',
            description: 'City of the user',
            type: 'string'
        },
        st: {
            label: 'State',
            description: 'State of the user. Two-letter state or province code for the United States, For example, "NY" for New York.',
            type: 'string'
        },
        zp: {
            label: 'ZIP/Postal Code',
            description: 'ZIP or postal code of the user. For example, "94025" for Menlo Park, CA, or "10001" for New York City.',
            type: 'string'
        },
        country: {
            label: 'Country',
            description: 'Country code of the user. This should be a valid ISO 3166-1 alpha-2 country code. For example, "US" for the United States.',
            type: 'string'
        }
    },
    default: {
        external_id: { '@path': '$.context.traits.userId' },
        em: { '@path': '$.context.traits.email' },
        ph: { '@path': '$.context.traits.phone' },
        fn: { '@path': '$.context.traits.first_name' },
        ln: { '@path': '$.context.traits.last_name' },
        ge: { '@path': '$.context.traits.gender' },
        db: { '@path': '$.context.traits.birthday' },
        ct: { '@path': '$.context.traits.address.city' },
        st: { '@path': '$.context.traits.address.state' },
        zp: { '@path': '$.context.traits.address.postal_code' },
        country: { '@path': '$.context.traits.address.country' }
    }
}

export const optionsFields: {
    eventID: InputField
    eventSourceUrl: InputField
    actionSource: InputField
    userData: InputField
} = {
    eventID,
    eventSourceUrl,
    actionSource,
    userData    
}

export const commonFields: {
    custom_data: InputField
} = {
    custom_data
}