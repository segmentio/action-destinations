import { InputField } from '@segment/actions-core'

export const group_properties: InputField = {
    label: 'Group Properties',
    type: 'object',
    description: 'Additional data tied to the group in Amplitude.',
    default: { '@path': '$.traits'}
}

export const group_type: InputField = {
    label: 'Group Type',
    type: 'string',
    description: 'The type of the group',
    required: true
}

export const group_value: InputField = {
    label: 'Group Value',
    type: 'string',
    description: 'The value of the group',
    required: true
}