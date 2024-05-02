import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient } from './hubspot-api'
import { RequestClient} from '@segment/actions-core'
import { INSERT_TYPES } from './constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Object',
  description: 'Upsert a record of any Object type to HubSpot and optionally assocate it with another record of any Object type.',
  fields: {
    // onMappingSave Hook Field
    createObject: {
        label: 'Create Object',
        description: "Specify if Segment should create a new Object Type automatically on HubSpot if it does not already exist.",
        type: 'boolean',
        required: true,
        default: false
    },
    // onMappingSave Hook Field
    createProperties: {
        label: 'Create Properties',
        description: "Specify if Segment should create new Properties automatically on HubSpot if they do not already exist.",
        type: 'boolean',
        required: true,
        default: false
    },
    // onMappingSave Hook Field
    createIdentifier: {
        label: 'Create Identifier',
        description: "Specify if Segment should create a new Identifier 'Unique Field' automatically on HubSpot if it does not already exist.",
        type: 'boolean',
        required: true,
        default: false
    },
    // onMappingSave Hook Field
    objectType: {
      label: 'Object Type',
      description:'The type of Hubspot Object to create, update or upsert the record to.',
      type: 'string',
      required: true,
      dynamic: true
    },
    // onMappingSave Hook Field
    insertType: {
      label: 'Insert Type',
      description: 'Specify if Segment should create, update or upsert a record.',
      type: 'string',
      choices: INSERT_TYPES,
      required: true,
      default: 'upsert'
    },
    // onMappingSave Hook Field
    idFieldName: {
      label: 'Object ID Field Name',
      description: "The name of the unique field Segment will use as an identifier when creating, updating or upserting a record of 'Object Type'.",
      type: 'string',
      required: true,
      dynamic: true
    },
    // onMappingSave Hook Field
    associationLabel: {
      label: 'Association Label',
      description: 'The type of Association between the two records. The Association must already exist in Hubspot.',
      type: 'string',
      dynamic: true
    },
    idFieldValue: {
      label: 'Object ID Field Value',
      description: "The value of the identifier to send to Hubspot.",
      type: 'string',
      required: true
    },
    stringProperties: {
      label: 'String Properties',
      description: 'String Properties to send to HubSpot.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    },
    numericProperties: {
      label: 'Number Properties',
      description: 'Number Properties to send to HubSpot.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    },
    booleanProperties: {
      label: 'Boolean Properties',
      description: 'Boolean Properties to send to HubSpot.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    },
    dateProperties: {
      label: 'Datetime Properties',
      description: 'Datetime Properties to send to HubSpot.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    },
     // onMappingSave Hook Field
    toIdFieldName: {
      label: 'To Object ID Field Name',
      description: "The name of the unique field Segment will use as an identifier when associating the record to another record. The unique field name must already exist on the Object in Hubspot.",
      type: 'string',
      dynamic: true
    },
    toIdFieldValue: {
      label: 'To Object ID Field Value',
      description: "The value of the identifier for the record to be associated with",
      type: 'string',
      dynamic: true
    },
    // onMappingSave Hook Field
    toObjectType: {
      label: 'To Object Type',
      description:'The type of Hubspot Object to associate the record to. This Object Type must already exist in Hubspot.',
      type: 'string',
      dynamic: true
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Hubspot by default',
      description: 'By default Segment batches events to Hubspot.',
      default: true
    },
    recordID: {
      label: 'Record ID',
      description: "Hubspot internal unique identifier for the Record.",
      type: 'string',
      unsafe_hidden: true, 
      default: undefined
    },
    toRecordID: {
      label: 'To Record ID',
      description: "Hubspot internal unique identifier for the To Record.",
      type: 'string',
      unsafe_hidden: true, 
      default: undefined
    }
  },
  dynamicFields: {
    objectType: async (request: RequestClient) => {
      const client = new HubspotClient(request)
      return await client.getObjectTypes()
    },
    idFieldName: async (request: RequestClient, { payload }) => {
      const client = new HubspotClient(request)
      return await client.getIdFields(payload.objectType) 
    },
    toObjectType: async (request: RequestClient) => {
      const client = new HubspotClient(request)
      return await client.getObjectTypes()
    },
    toIdFieldName: async (request: RequestClient, { payload }) => {
      const toObjectType = payload.toObjectType
      if(!toObjectType) {
          return {
              choices: [],
              nextPage: '',
              error: {
                  message: "'To Object Type' is required before fetching 'To Object ID Field' field",
                  code: "'To Object Type' is required before fetching 'To Object ID Field' field"
              }
          }
      }
      const client = new HubspotClient(request)
      return await client.getIdFields(toObjectType) 
    },
    associationLabel: async (request: RequestClient, { payload }) => {
      let { objectType, toObjectType }  = payload 
      objectType = 'companies'
      toObjectType = 'contacts'
      if(!objectType || !toObjectType) {
          return {
              choices: [],
              nextPage: '',
              error: {
                  message: "'Object Type' and 'To Object Type' fields are required before fetching 'Association Label' field.",
                  code: "'Object Type' and 'To Object Type' fields are required before fetching 'Association Label' field."
              }
          }
      }
      const client = new HubspotClient(request)
      return await client.getAssociationLabel(objectType, toObjectType) 
    }
  },
  perform: async (request, { payload }) => {
    const hubspotClient = new HubspotClient(request)
    await hubspotClient.ensureObjects([payload])
    await hubspotClient.ensureObjects([payload], true)
    await hubspotClient.ensureAssociations([payload])
  },
  performBatch: async (request, { payload: payloads }) => {
    const hubspotClient = new HubspotClient(request)
    await hubspotClient.ensureObjects(payloads)
    await hubspotClient.ensureObjects(payloads, true)
    await hubspotClient.ensureAssociations(payloads)
  }
}

export default action
