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
      const { objectType, toObjectType }  = payload 
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
  // perform: async (request, { payload }) => {
    
  //   const { objectType, toObjectType, insertType, idFieldName, idFieldValue, toIdFieldName, toIdFieldValue, stringProperties, numericProperties, booleanProperties, dateProperties, associationLabel } = payload

  //   const client = new HubspotClient(request)

  //   const toRecordId = associationLabel ? await client.getRecordID(toObjectType, toIdFieldName, toIdFieldValue) : undefined; 

  //   if(['update', 'upsert'].includes(insertType)){
      
  //     const recordId = await client.getRecordID(objectType, idFieldName, idFieldValue)
      
  //     if(recordId){
  //       const updateResponse = await client.update(idFieldName, recordId, objectType, { ...flattenObject({...stringProperties, ...numericProperties, ...booleanProperties, ...dateProperties}) })
        
  //       if(toRecordId){
  //         await client.associate(recordId, toRecordId, associationLabel as string, objectType, toObjectType as string)
  //       }
        
  //       return updateResponse
  //     }      
  //   }

  //   if(['create', 'upsert'].includes(payload.insertType)){
  //     return await client.create(objectType, { ...flattenObject({...stringProperties, ...numericProperties, ...booleanProperties, ...dateProperties})}, associationLabel, toRecordId)
  //   }
  // },

  perform: async (request, { payload }) => {
   
      const payloads = [
        {...payload, objectType: 'companies', idFieldName: 'co_id', idFieldValue: 'company_1', toIdFieldValue: 'id555555@gmail.com', toIdFieldName: 'email', toObjectType: 'contacts'},
        {...payload, objectType: 'companies', idFieldName: 'co_id', idFieldValue: 'company_2', toIdFieldValue: 'id444@gmail.com', toIdFieldName: 'email', toObjectType: 'contacts'},
        {...payload, objectType: 'companies', idFieldName: 'co_id', idFieldValue: 'company_3', toIdFieldValue: 'mumble@gmail.com', toIdFieldName: 'email', toObjectType: 'contacts'},
        {...payload, objectType: 'companies', idFieldName: 'co_id', stringProperties: {city: "Dublin"}, idFieldValue: 'company_4', toIdFieldValue: 'mumble@gmail.com', toIdFieldName: 'email', toObjectType: 'contacts'},
        {...payload, objectType: 'companies', idFieldName: 'co_id', stringProperties: {city: "London"}, idFieldValue: 'company_5', toIdFieldValue: 'mumble@gmail.com', toIdFieldName: 'email', toObjectType: 'contacts'},
        {...payload, objectType: 'companies', idFieldName: 'co_id', idFieldValue: 'company_6', toIdFieldValue: 'mumble@gmail.com', toIdFieldName: 'email', toObjectType: 'contacts'}
      ]

      const [{insertType, idFieldName, objectType}] = payloads

      const hubspotClient = new HubspotClient(request)

      await hubspotClient.ensureObjects(insertType, idFieldName, objectType, payloads)

  }
}

export default action
