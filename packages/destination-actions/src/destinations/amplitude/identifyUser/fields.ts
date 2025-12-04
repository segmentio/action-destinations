import { InputField } from '@segment/actions-core'

export const paying: InputField = {
    label: 'Is Paying',
    type: 'boolean',
    description: 'Whether the user is paying or not.'
}
export const start_version: InputField = {
    label: 'Initial Version',
    type: 'string',
    description: 'The version of the app the user was first on.'
}