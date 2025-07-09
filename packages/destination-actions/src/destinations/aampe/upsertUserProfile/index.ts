import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { contact_id, event_name, time, metadata, event_id, user_properties } from '../fields'
import { UserProperty } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert User Profile',
  description: '',
  fields: {
    contact_id, 
    event_name,
    time, 
    metadata, 
    event_id,
    user_properties
  },
  perform: (request, { payload, settings }) => {
    const { contact_id, event_name, time, metadata, event_id, user_properties } = payload

    const json: UserProperty = {
      contact_id,
      event_name,
      time: new Date(time).getTime() / 1000,
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
