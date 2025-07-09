import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UserEvent } from '../types'
import { contact_id, event_name, time, timezone, metadata, event_id } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Send events and user properties to Aampe.',
  defaultSubscription: 'type = "track" or type = "page" or type = "screen"',
  fields: {
    contact_id, 
    event_name,
    time, 
    timezone, 
    metadata, 
    event_id    
  },
  perform: (request, { payload, settings }) => {
    const { contact_id, event_name, time, timezone, metadata, event_id } = payload

    const json: UserEvent = {
      contact_id,
      event_name,
      time: new Date(time).getTime() / 1000,
      timezone,
      metadata,
      event_id
    }

     return request(`${settings.region}events`, {
      method: 'post',
      json
    })
  }
}

export default action
