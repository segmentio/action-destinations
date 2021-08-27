import { InputField } from "@segment/actions-core/src/destination-kit/types"

// Implementation of the facebook pixel object properties.
// https://developers.facebook.com/docs/facebook-pixel/reference#object-properties
// Only implemented properties that are shared between more than one action.

export const currency: InputField = {
    label: 'Currency',
    description: 'currency',
    type: 'string'
}

export const value: InputField = {
    label: 'Value',
    description: 'value',
    type: 'number'
}

export const content_category: InputField = {
    label: 'Content Category',
    description: 'Content Category',
    type: 'string'
}

export const content_ids: InputField = {
    label: 'Content IDs',
    description: 'Product IDs associated with the event, such as SKUs (e.g. ["ABC123", "XYZ789"]).',
    type: 'object'
}

export const content_name: InputField = {
    label: 'Content Name',
    description: 'Name of the page/product.',
    type: 'string'
}

export const content_type: InputField = {
    label: 'Content Type',
    description: 'content type',
    type: 'string'
}

export const contents: InputField = {
    label: 'Contents',
    description: 'An array of JSON objects',
    type: 'object'
}

export const num_items: InputField = {
    label: 'Number of Items',
    description: 'Number of Items',
    type: 'number'
}