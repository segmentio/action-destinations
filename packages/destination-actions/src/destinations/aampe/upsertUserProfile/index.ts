import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { contact_id, event_name, timestamp, metadata, event_id, user_properties } from '../fields'
import { UserProperty } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert User Profile',
  description: 'Send user profile updates to Aampe.',
  defaultSubscription: 'type = "identify"',
  fields: {
    contact_id,
    event_name: {
      ...event_name,
      default: 'User Profile Updated'
    },
    timestamp,
    metadata,
    event_id,
    user_properties: {
      ...user_properties,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.context.traits' }
        }
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const { contact_id, event_name, timestamp, metadata, event_id, user_properties } = payload

    const json: UserProperty = {
      contact_id,
      event_name,
      timestamp: new Date(timestamp).getTime() / 1000,
      metadata,
      event_id,
      user_properties
    }

    return request(`${settings.region}properties`, {
      method: 'post',
      json
    })
  }
}

export default action
