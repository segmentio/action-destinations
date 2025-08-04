import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { contact_id, event_name, timestamp, metadata, event_id, user_properties } from '../fields'
import { UserProperty } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert User Profile',
  description: 'Send user profile updates to Aampe.',
  defaultSubscription: 'type = "identify" or type = "track" or type = "page" or type = "screen"',
  fields: {
    contact_id,
    event_name: {
      ...event_name,
      default: 'User Profile Updated'
    },
    timestamp,
    metadata,
    event_id,
    user_properties
  },
  perform: (request, { payload, settings }) => {
    const { contact_id, event_name, timestamp, metadata, event_id, user_properties } = payload

    if (!user_properties || Object.keys(user_properties).length === 0) {
      throw new PayloadValidationError('Upsert User Profile action requires at least one user property to be set')
    }

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
