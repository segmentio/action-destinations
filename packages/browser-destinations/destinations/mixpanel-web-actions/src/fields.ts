import { InputField } from '@segment/actions-core'

export const event_name: InputField = {
    label: 'Event Name',
    description: 'The name of the event to track in Mixpanel.',
    required: true,
    type: 'string',
    default: { '@path': '$.event' }
}

export const properties: InputField ={
    label: 'Event Properties',
    description: 'Properties to associate with the event.',
    required: false,
    type: 'object',
    default: { '@path': '$.properties'}
}

export const unique_id: InputField = {
    label: 'Unique ID',
    description: 'The unique ID to associate with the user.',
    required: true,
    type: 'string',
    default: { '@path': '$.userId' }
}

export const user_profile_properties_to_set: InputField = {
    label: 'User Profile Properties to Set',
    description: 'User Profile Properties to set on the user profile in Mixpanel.',
    required: false,
    defaultObjectUI: 'keyvalue',
    additionalProperties: true,
    type: 'object',
    properties: {
        name: {
            label: 'Name',
            description: 'The name of the user.',
            type: 'string'
        },
        first_name: {
            label: 'First Name',
            description: 'The first name of the user.',
            type: 'string'
        },
        last_name: {
            label: 'Last Name',
            description: 'The last name of the user.',
            type: 'string'
        },
        email: {
            label: 'Email',
            description: 'The email of the user.',
            type: 'string',
            format: 'email'
        },
        phone: {
            label: 'Phone',
            description: 'The phone number of the user.',
            type: 'string'
        },
        avatar: {
            label: 'Avatar',
            description: 'The avatar URL of the user.',
            type: 'string',
            format: 'uri'
        },
        created: {
            label: 'Created',
            description: 'The creation date of the user profile.',
            type: 'string',
            format: 'date-time'
        }
    },
    default: { 
        name: { '@path': '$.traits.name' },
        first_name: { '@path': '$.traits.first_name' },
        last_name: { '@path': '$.traits.last_name' },
        email: { '@path': '$.traits.email' },
        phone: { '@path': '$.traits.phone' },
        avatar: { '@path': '$.traits.avatar' },
        created: { '@path': '$.traits.created_at' }
    }
}

export const user_profile_properties_to_set_once: InputField = {
    label: 'User Profile Properties to Set Once',
    description: 'User Profile Properties to set once on the user profile in Mixpanel. Values which get set once cannot be overwritten later.',
    required: false,
    defaultObjectUI: 'keyvalue',
    type: 'object'
}

export const user_profile_properties_to_increment: InputField =  {
    label: 'User Profile Properties to Increment',
    description: 'User Profile Properties to increment on the user profile in Mixpanel. Values must be numeric.',
    required: false,
    defaultObjectUI: 'keyvalue',
    type: 'object'
}

export const group_details: InputField = {
    label: 'Group Details',
    description: 'Details for the group to be created or updated in Mixpanel.',
    type: 'object',
    defaultObjectUI: 'keyvalue:only',
    additionalProperties: false,
    required: true,
    properties: {
    group_key: {
        label: 'Group Key',
        description: 'The Group Key / type of group to associate with the user. This group key should already be defined in your Mixpanel project.',
        required: true,
        type: 'string'
    },
    group_id: {
        label: 'Group ID',
        description: 'The unique ID to associate with the group.',
        required: true,
        type: 'string'
    }
    },
    default: {
        group_key: { '@path': '$.traits.group_key' },
        group_id: { '@path': '$.groupId' }
    }
}

export const group_profile_properties_to_set: InputField = {
    label: 'Group properties to Set',
    description: 'Group Profile Properties to set on the group in Mixpanel.',
    required: false,
    defaultObjectUI: 'keyvalue',
    type: 'object'
}

export const group_profile_properties_to_set_once: InputField = {
    label: 'Group properties to set once',
    description: 'Group Profile Properties to set once on the group profile in Mixpanel. Values which get set once cannot be overwritten later.',
    required: false,
    defaultObjectUI: 'keyvalue',
    type: 'object'
}

export const group_profile_properties_to_union: InputField = {
    label: 'Group list properties to union',
    description: 'Merge a list into a list group property. Duplicates will be removed.',
    required: false,
    type: 'object',
    multiple: true,
    defaultObjectUI: 'arrayeditor',
    additionalProperties: false,
    properties: {
        list_name: {
            label: 'List Name',
            description: 'The name of the list property to union values into.',
            type: 'string',
            allowNull: false,
            required: true
        },
        string_values: {
            label: 'Values',
            description: 'An array of string values to merge into the list. Non string lists cannot be updated. Duplicates will be removed.',
            type: 'string',
            required: true,
            allowNull: false,
            multiple: true
        }
    }
}

