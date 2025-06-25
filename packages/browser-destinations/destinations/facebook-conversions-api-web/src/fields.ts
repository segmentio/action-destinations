import type { InputField } from '@segment/actions-core'
import { ACTION_SOURCES } from './types'

export const eventID: InputField = {
    label: 'Event ID',
    description: 'A unique identifier for the event. This can be used to deduplicate events.',
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
            description: 'A unique identifier for the user from your system, hashed with SHA-256.',
            type: 'string'
        },
        em: {
            label: 'Email',
            description: 'Email address of the user, hashed with SHA-256.',
            type: 'string',
            format: 'email'
        },
        ph: {
            label: 'Phone Number',
            description: 'Phone number of the user, hashed with SHA-256.',
            type: 'string'
        },
        fn: {
            label: 'First Name',
            description: 'First name of the user, hashed with SHA-256.',
            type: 'string'  
        },
        ln: {
            label: 'Last Name',
            description: 'Last name of the user, hashed with SHA-256.',
            type: 'string'
        },
        ge: {
            label: 'Gender',
            description: 'Gender of the user, hashed with SHA-256.',
            type: 'string'
        },
        db: {
            label: 'Date of Birth',
            description: 'Date of birth of the user, hashed with SHA-256.',
            type: 'string'
        },
        ct: {
            label: 'City',
            description: 'City of the user, hashed with SHA-256.',
            type: 'string'
        },
        st: {
            label: 'State',
            description: 'State of the user, hashed with SHA-256.',
            type: 'string'
        },
        zp: {
            label: 'ZIP/Postal Code',
            description: 'ZIP or postal code of the user, hashed with SHA-256.',
            type: 'string'
        },
        country: {
            label: 'Country',
            description: 'Country code of the user, hashed with SHA-256.',
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

export const currency: InputField = {
    label: 'Currency',
    description: 'The currency for the value specified. E.g. USD, EUR, etc.',
    type: 'string',
    default: { '@path': '$.properties.currency' }
}

export const value: InputField = {
    label: 'Value',
    description: 'The value of a user performing this event to the business. e.g. 99.95',
    type: 'number',
    default: { '@path': '$.properties.value' }
}
