import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient, SyncMode } from './hubspot-api'
import { commonFields } from './common-fields'

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
    if (!payload.record_details.object_id && !payload.record_details.email && !payload.record_details.utk) {
      throw new PayloadValidationError('At least one of object_id, email or utk is required')
    }

    if (payload.record_details.object_id && typeof payload.record_details.object_id !== 'number') {
      throw new PayloadValidationError('Object ID must be numeric')
    }

    if (payload.record_details.email && payload.record_details.object_type !== 'contact') {
      throw new PayloadValidationError('Email can only be used to associate an event with a Contacts object')
    }

    if (payload.record_details.utk && payload.record_details.object_type !== 'contact') {
      throw new PayloadValidationError('User Token can only be used to associate an event with a Contacts object')
    }

    const hubspotClient = new HubspotClient(request, syncMode as SyncMode)
    await hubspotClient.send(payload)
  }
}

export default action
