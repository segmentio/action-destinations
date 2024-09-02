import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient, SyncMode } from './hubspot-api'
import { commonFields } from './common-fields'
import { validate } from './utils'

import { dynamicReadEventNames, dynamicReadObjectTypes, dynamicReadProperties } from './dynamic-fields'

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
    validate(payload)
    const hubspotClient = new HubspotClient(request, syncMode as SyncMode)
    return await hubspotClient.send(payload)
  }
}

export default action
