import { InputField } from '@segment/actions-core/destination-kit/types'
import { INSERT_TYPES } from './constants'

// onMappingSave Hook Field
export const createObject: InputField = {
        label: 'Create Object',
        description: "Specify if Segment should create a new Object Type automatically on HubSpot if it does not already exist.",
        type: 'boolean',
        required: true,
        default: false
}
// onMappingSave Hook Field
export const createProperties: InputField = {
    label: 'Create Properties',
    description: "Specify if Segment should create new Properties automatically on HubSpot if they do not already exist.",
    type: 'boolean',
    required: true,
    default: false
}
export const createIdentifier: InputField = {
    label: 'Create Identifier',
    description: "Specify if Segment should create a new Identifier 'Unique Field' automatically on HubSpot if it does not already exist.",
    type: 'boolean',
    required: true,
    default: false
}

export const objectType: InputField = {
    label: 'Object Type',
    description:'The type of Hubspot Object to create, update or upsert the record to.',
    type: 'string',
    required: true,
    dynamic: true
}

export const insertType: InputField = {
    label: 'Insert Type',
    description: 'Specify if Segment should create, update or upsert a record.',
    type: 'string',
    choices: INSERT_TYPES,
    required: true,
    default: 'upsert'
}

export const idFieldName: InputField = {
    label: 'Object ID Field Name',
    description: "The name of the unique field Segment will use as an identifier when creating, updating or upserting a record of 'Object Type'.",
    type: 'string',
    required: true,
    dynamic: true
}

// onMappingSave Hook Field
export const associationLabel: InputField = {
    label: 'Association Label',
    description: 'The type of Association between the two records. The Association must already exist in Hubspot.',
    type: 'string',
    dynamic: true
}

export const idFieldValue: InputField = {
    label: 'Object ID Field Value',
    description: "The value of the identifier to send to Hubspot.",
    type: 'string',
    required: true
}
   
export const stringProperties: InputField = {
    label: 'String Properties',
    description: 'String Properties to send to HubSpot.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue:only',
    allowNull: false
}
   
export const numericProperties: InputField = {
    label: 'Number Properties',
    description: 'Number Properties to send to HubSpot.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue:only',
    allowNull: false
} 

export const booleanProperties: InputField = {
    label: 'Boolean Properties',
    description: 'Boolean Properties to send to HubSpot.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue:only',
    allowNull: false
} 

export const dateProperties: InputField = {
    label: 'Datetime Properties',
    description: 'Datetime Properties to send to HubSpot.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue:only',
    allowNull: false
} 
 
export const toIdFieldName: InputField = {
    label: 'To Object ID Field Name',
    description: "The name of the unique field Segment will use as an identifier when associating the record to another record. The unique field name must already exist on the Object in Hubspot.",
    type: 'string',
    dynamic: true
} 
  
export const toIdFieldValue: InputField = {
    label: 'To Object ID Field Value',
    description: "The value of the identifier for the record to be associated with",
    type: 'string',
    dynamic: true
} 

// onMappingSave Hook Field
export const toObjectType: InputField = {
    label: 'To Object Type',
    description:'The type of Hubspot Object to associate the record to. This Object Type must already exist in Hubspot.',
    type: 'string',
    dynamic: true
} 
 
export const enable_batching: InputField = {
      type: 'boolean',
      label: 'Batch Data to Hubspot by default',
      description: 'By default Segment batches events to Hubspot.',
      default: true,
      unsafe_hidden: true
}

export const batch_size: InputField = {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch.',
      type: 'number',
      required: true,
      unsafe_hidden: true,
      default: 100
}

export const recordID: InputField = {
      label: 'Record ID',
      description: "Hubspot internal unique identifier for the Record.",
      type: 'string',
      unsafe_hidden: true, 
      default: undefined
}

export const toRecordID: InputField = {
      label: 'To Record ID',
      description: "Hubspot internal unique identifier for the To Record.",
      type: 'string',
      unsafe_hidden: true, 
      default: undefined
}