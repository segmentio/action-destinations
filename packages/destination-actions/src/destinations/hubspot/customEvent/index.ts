import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient, SyncMode } from './hubspot-api'
import { commonFields } from './common-fields'
import {
  dynamicReadEventNames,
  dynamicReadObjectTypes,
  dynamicReadIdFields,
  dynamicReadProperties
} from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send Custom Events to HubSpot',
  syncMode: {
    description: 'Specify how Segment should update event schemas in Hubspot',
    label: 'Sync Mode',
    default: 'update',
    choices: [
      { label: 'Create new event schemas, and update existing event schemas', value: 'upsert' },
      { label: 'Create new event schemas, but do not update existing event schemas', value: 'add' },
      { label: 'Update existing event schemas, but do not create new event schemas', value: 'update' }
    ]
  },
  fields: {
    ...commonFields
  },
  dynamicFields: {
    event_name: async (request) => {
      return await dynamicReadEventNames(request)
    },
    record_details: {
      object_type: async (request) => {
        return await dynamicReadObjectTypes(request)
      },
      object_id_field_name: async (request, { payload }) => {
        const objectType = payload?.record_details?.object_type
        if (!objectType) {
          throw new Error("Select from 'Object Type' first")
        }
        return await dynamicReadIdFields(request, objectType)
      }
    },
    properties: {
      __keys__: async (request, { payload }) => {
        const eventName = payload?.event_name
        if (!eventName) {
          throw new Error("Select from 'Event Name' first")
        }
        return await dynamicReadProperties(request, eventName)
      }
    }
  },
  perform: async (request, { payload, syncMode }) => {
    const payloads = [
      payload,
      { ...payload, event_name: 'pe23132826_custom_joe_event_1' },
      { ...payload, event_name: 'test3', properties: { test: 'test' } }
    ]

    await send(request, payloads, syncMode as SyncMode)
  },
  performBatch: async (request, { payload, syncMode }) => {
    await send(request, payload, syncMode as SyncMode)
  }
}

const send = async (request: RequestClient, payloads: Payload[], syncMode: SyncMode) => {
  //const x = await dynamicReadProperties(request, 'pe23132826_company_updated')

  //const x = await dynamicReadEventNames(request)

  //const x = await dynamicReadObjectTypes(request)

  //const x = await dynamicReadIdFields(request, 'p23132826_zoo_animals')

  //console.log(JSON.stringify(x, null, 2))

  const hubspotClient = new HubspotClient(request, syncMode, payloads)

  const x = await hubspotClient.hsEventSchemas()
  console.log(JSON.stringify(x, null, 2))
}

export default action
