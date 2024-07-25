import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient, AssociationSyncMode } from './hubspot-api'
//import { RequestClient} from '@segment/actions-core'
import { commonFields } from './common-fields'
import { dynamicReadAssociationLabels, dynamicReadIdFields, dynamicReadObjectTypes, dynamicReadPropertyGroups } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Object',
  description: 'Upsert a record of any Object type to HubSpot and optionally assocate it with another record of any Object type.',
  syncMode: {
    description: 'Specify how Segment should update Records in Hubspot',
    label: 'Sync Mode',
    default: 'update',
    choices: [
      { label: 'Create new records, and update existing records', value: 'upsert' },
      { label: "Create new records, but do not update existing records", value: 'add' },
      { label: 'Update existing records, but do not create new records', value: 'update' }
    ]
  },
  fields: {
    ...commonFields
  },
  dynamicFields: {
    object_details: {
      from_object_type: async (request ) => {
        const client = new HubspotClient(request)
        return await client.dynamicReadObjectTypes()
      },
      from_id_field_name: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.from_object_type

        if (!fromObjectType) {
          throw new Error("Select from 'From Object Type' first")
        }
        
        const client = new HubspotClient(request)
        return await client.dynamicReadIdFields(fromObjectType) 
      },
      from_property_group: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.from_object_type

        if (!fromObjectType) {
          throw new Error("Select from 'From Object Type' first")
        }
        
        const client = new HubspotClient(request)
        return await client.dynamicReadPropertyGroups(fromObjectType) 
      } 
    },
    associations: {
      to_object_type: async (request) => {
        const client = new HubspotClient(request)
        return await client.dynamicReadObjectTypes()
      },
      association_label: async (request, { dynamicFieldContext, payload }) => {
        const selectedIndex = dynamicFieldContext?.selectedArrayIndex
        
        if (selectedIndex === undefined) {
          throw new Error('Selected array index is missing')
        }
   
        const fromObjectType = payload?.object_details?.from_object_type
        const toObjectType = payload?.associations?.[selectedIndex]?.to_object_type

        if (!fromObjectType) {
          throw new Error("Select from 'Object Type' first")
        }
        
        if (!toObjectType) {
          throw new Error("Select from 'To Object Type' first")
        }

        const client = new HubspotClient(request)
        return await client.dynamicReadAssociationLabels(fromObjectType, toObjectType) 
      },
      to_id_field_name: async (request, { dynamicFieldContext, payload }) => {
        
        const selectedIndex = dynamicFieldContext?.selectedArrayIndex
        
        if (selectedIndex === undefined) {
          throw new Error('Selected array index is missing')
        }
  
        const toObjectType = payload?.associations?.[selectedIndex]?.to_object_type

        if (!toObjectType) {
          throw new Error("Select from 'To Object Type' first")
        }

        const client = new HubspotClient(request)
        return await client.dynamicReadIdFields(toObjectType) 
      }
    }
  },
  perform: async (request, { payload, syncMode }) => {

    const payloads = [payload]

    const hubspotClient = new HubspotClient(
      request, 
      payload.object_details.from_object_type, 
      payload.object_details.from_id_field_name,
      'upsert', 
      payload.association_sync_mode as AssociationSyncMode)
    
    // const x = await dynamicReadObjectTypes(request)
    // const x = await dynamicReadIdFields(request, 'meetings')
    // const x = await dynamicReadAssociationLabels(request, 'meetings', 'contacts')
    // const x = await dynamicReadPropertyGroups(request, 'meetings')
    
    //const x = await hubspotClient.readProperties('contacts')
    // const x = hubspotClient.findUniqueFromProps(payloads)

    //console.log(JSON.stringify(payloads, null, 2))  
    const uniqueProps = hubspotClient.findUniquePayloadsProps(payloads)
    //console.log(uniqueProps) 
    const contactProps = await hubspotClient.readProperties('companies')
    //console.log(contactProps) 
    const propsToCreate = hubspotClient.createListPropsToCreate(uniqueProps, contactProps)
    //console.log(propsToCreate) 
    
    await hubspotClient.ensurePropertiesInObjSchema('companies', 'Companyinformation', propsToCreate )

    const existingFromRecords = await hubspotClient.ensureFromRecordsExistInHubspot([payload], 'upsert')

    await hubspotClient.buildToRecordRequest(existingFromRecords)
    
    //await hubspotClient.ensureObjects([payload], true)
    //await hubspotClient.ensureAssociations([payload])
  },
  performBatch: async (request, { payload: payloads, syncMode }) => {
    // const hubspotClient = new HubspotClient(request, syncMode as string)
    // await hubspotClient.ensureProperties(payloads)
   // await hubspotClient.ensureFromRecords(payloads)
    //await hubspotClient.ensureObjects(payloads, true)
    //await hubspotClient.ensureAssociations(payloads)
  }
}

export default action
