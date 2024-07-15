import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient } from './hubspot-api'
import { RequestClient} from '@segment/actions-core'
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
