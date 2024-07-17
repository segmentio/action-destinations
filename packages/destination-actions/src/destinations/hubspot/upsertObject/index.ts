import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient } from './hubspot-api'
//import { RequestClient} from '@segment/actions-core'
import { commonFields } from './common-fields'

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

    const payloads = [{
      object_details: { 
        from_object_type: "contacts"
      },
      properties: {
        "prop0": "value0",
        "amount_in_home_currency" : "value1",
        "prop2" : "value2",
        "prop3" : 22,
        "hs_date_entered_marketingqualifiedlead": "sdsd",
        "prop4" : true
      }
    },
    {
      object_details: { 
        from_object_type: "contact"
      },
      properties: {
        "amount_in_home_currency" : "valueA",
        "hs_calculated_phone_number_country_code": "menkhkjh",
        "prop2" : "valueB",
        "prop3" : "98",
        "prop5" : [],
        "prop6" : {},
        "prop7" : 12345.23456,
        "prop4" : false
      }
    }]

    const hubspotClient = new HubspotClient(request, syncMode as string)
    
    //const x = await hubspotClient.dynamicReadObjectTypes()
    // const x = await hubspotClient.dynamicReadIdFields('meetings')
    // const x = await hubspotClient.dynamicReadAssociationLabels('meetings', 'contacts')
    // const x = await hubspotClient.dynamicReadPropertyGroups('meetings')
    //const x = await hubspotClient.readProperties('contacts')
    
    const x = hubspotClient.findUniquePropertiesFromPayloads(payloads)
     console.log(x[0].name)
    //await hubspotClient.ensureProperties(payloads)
   // await hubspotClient.ensureFromObjects([payload])
    //await hubspotClient.ensureObjects([payload], true)
    //await hubspotClient.ensureAssociations([payload])
  },
  performBatch: async (request, { payload: payloads, syncMode }) => {
    // const hubspotClient = new HubspotClient(request, syncMode as string)
    // await hubspotClient.ensureProperties(payloads)
   // await hubspotClient.ensureFromObjects(payloads)
    //await hubspotClient.ensureObjects(payloads, true)
    //await hubspotClient.ensureAssociations(payloads)
  }
}

export default action
