import { InputField } from '@segment/actions-core'
import { INSERT_TYPES } from './constants'

export const commonFields: Record<string, InputField> = {
    // onMappingSave Hook Field
    createObject: {
            label: 'Create Object',
            description: "Specify if Segment should create a new Object Type automatically on HubSpot if it does not already exist.",
            type: 'boolean',
            required: true,
            default: false
    },
    // onMappingSave Hook Field
    createProperties:{
        label: 'Create Properties',
        description: "Specify if Segment should create new Properties automatically on HubSpot if they do not already exist.",
        type: 'boolean',
        required: true,
        default: false
    },
    createIdentifier:{
        label: 'Create Identifier',
        description: "Specify if Segment should create a new Identifier 'Unique Field' automatically on HubSpot if it does not already exist.",
        type: 'boolean',
        required: true,
        default: false
    },
    objectType:{
        label: 'Object Type',
        description:'The type of Hubspot Object to create, update or upsert the record to.',
        type: 'string',
        required: true,
        dynamic: true
    },
    insertType:{
        label: 'Insert Type',
        description: 'Specify if Segment should create, update or upsert a record.',
        type: 'string',
        choices: INSERT_TYPES,
        required: true,
        default: 'upsert'
    },
    idFieldName:{
        label: 'Object ID Field Name',
        description: "The name of the unique field Segment will use as an identifier when creating, updating or upserting a record of 'Object Type'.",
        type: 'string',
        required: true,
        dynamic: true
    },
    // onMappingSave Hook Field
    associationLabel:{
        label: 'Association Label',
        description: 'The type of Association between the two records. The Association must already exist in Hubspot.',
        type: 'string',
        dynamic: true
    },
    idFieldValue:{
        label: 'Object ID Field Value',
        description: "The value of the identifier to send to Hubspot.",
        type: 'string',
        required: true
    }, 
    stringProperties:{
        label: 'String Properties',
        description: 'String Properties to send to HubSpot.',
        type: 'object',
        required: false,
        defaultObjectUI: 'keyvalue:only',
        allowNull: false
    }, 
    numericProperties:{
        label: 'Number Properties',
        description: 'Number Properties to send to HubSpot.',
        type: 'object',
        required: false,
        defaultObjectUI: 'keyvalue:only',
        allowNull: false
    },
    booleanProperties:{
        label: 'Boolean Properties',
        description: 'Boolean Properties to send to HubSpot.',
        type: 'object',
        required: false,
        defaultObjectUI: 'keyvalue:only',
        allowNull: false
    },
    dateProperties:{
        label: 'Datetime Properties',
        description: 'Datetime Properties to send to HubSpot.',
        type: 'object',
        required: false,
        defaultObjectUI: 'keyvalue:only',
        allowNull: false
    }, 
    toIdFieldName:{
        label: 'To Object ID Field Name',
        description: "The name of the unique field Segment will use as an identifier when associating the record to another record. The unique field name must already exist on the Object in Hubspot.",
        type: 'string',
        dynamic: true
    }, 
    toIdFieldValue:{
        label: 'To Object ID Field Value',
        description: "The value of the identifier for the record to be associated with",
        type: 'string',
        dynamic: true
    },
    // onMappingSave Hook Field
    toObjectType:{
        label: 'To Object Type',
        description:'The type of Hubspot Object to associate the record to. This Object Type must already exist in Hubspot.',
        type: 'string',
        dynamic: true
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
    },
    recordID:{
        label: 'Record ID',
        description: "Hubspot internal unique identifier for the Record.",
        type: 'string',
        unsafe_hidden: true, 
        default: undefined
    },
    toRecordID:{
        label: 'To Record ID',
        description: "Hubspot internal unique identifier for the To Record.",
        type: 'string',
        unsafe_hidden: true, 
        default: undefined
    }
}