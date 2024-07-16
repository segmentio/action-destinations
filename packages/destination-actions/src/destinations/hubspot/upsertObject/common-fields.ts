import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
    object_details: {
        label: 'Object Details',
        description: 'Details of the object to associate the record with',
        type: 'object',
        required: true,
        defaultObjectUI: 'keyvalue:only',
        additionalProperties: false,
        properties: {
            from_object_type: {
                label: 'Object Type',
                description: 'The type of Hubspot Object to add/update a record for.',
                type: 'string',
                required: true,
                dynamic: true
            },
            from_id_field_name: {
                label: 'Object ID Field Name',
                description: 'The name of the ID field for the record.',
                type: 'string',
                required: true,
                dynamic: true
            },
            from_id_field_value: {
                label: 'Object ID Field Value',
                description: 'The ID value for the record.',
                type: 'string',
                required: true
            },
            from_hs_object_id: {
                label: 'Canonical Record ID',
                description: 'The canonical record ID for the record. This will be fetched from Hubspot and cannot be supplied by the end user.',
                type: 'string',
                unsafe_hidden: true,
                required: false,
                default: undefined
            }
        }
    },
    properties: {
        label: 'Properties',
        description: 'Properties to set on the record.',
        type: 'object',
        required: false,
        defaultObjectUI: 'keyvalue',
        additionalProperties: true,
        default: {
            '@path': 'properties'
        }
    },
    associations: {
        label: 'Associations',
        description: 'Associations to create between the record and other records.',
        type: 'object',
        multiple: true,
        required: false,
        defaultObjectUI: 'arrayeditor',
        additionalProperties: false,
        properties: {
            to_object_type: {
                label: 'To Object Type',
                description: 'The type of associated Hubspot Object.',
                type: 'string',
                required: true,
                dynamic: true
            },
            association_label: {
                label: 'Association Label',
                description:
                'The type of Association between the two records. The Association must already exist in Hubspot.',
                type: 'string',
                required: true,
                dynamic: true
            },
            to_id_field_name: {
                label: 'To Object ID Field Name',
                description:
                'The name of the unique field Segment will use as an identifier when associating the record to another record. The unique field name must already exist on the Object in Hubspot.',
                type: 'string',
                required: true,
                dynamic: true
            },
            to_id_field_value: {
                label: 'To Object ID Field Value',
                description: 'The value of the identifier for the record to be associated with',
                type: 'string',
                required: true
            },
            to_hs_object_id: {
                label: 'Canonical Record ID',
                description: 'The canonical record ID for the record. This will be fetched from Hubspot and cannot be supplied by the end user.',
                type: 'string',
                unsafe_hidden: true,
                required: false,
                default: undefined
            }
        }
    },
    createAssociatedObjectProperties: {
        label: 'Create Associated Object Properties',
        description: 'Indicates if Segment should create new Properties fields on the associated object. Segment will infer the field types based on payload data. String, number and date types are supported. Other types will be converted to string.',
        type: 'boolean',
        required: true,
        default: false
    },
    enable_batching:{
        type: 'boolean',
        label: 'Batch Data to Hubspot by default',
        description: 'By default Segment batches events to Hubspot.',
        default: true,
        unsafe_hidden: true
    },
    batch_size:{
        label: 'Batch Size',
        description: 'Maximum number of events to include in each batch.',
        type: 'number',
        required: true,
        unsafe_hidden: true,
        default: 100
    }
}