import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send track events to Schematic',
  fields: {
    event_name: {
      label: 'Event name',
      description: 'Name of event',
      type: 'string',
      required: true
    },
    company_keys: {
      label: 'Company key name',
      description: 'Key-value pairs associated with a company (e.g. organization_id: 123456)',
      type: 'object',
      required: false
    },
    user_keys: {
      label: 'User keys',
      description: 'Key-value pairs associated with a user (e.g. email: example@example.com)',
      type: 'object',
      required: false
    },
    traits: {
      label: 'Traits',
      description: 'Additional properties to send with event',
      type: 'object',
      required: false
    }
  },

  perform: (request, { settings, payload }) => {
    return request('https://api.schematichq.com/events', {
      method: 'post',
      headers: { 'X-Schematic-Api-Key': `${settings.apiKey}` },
      responseType: 'json',
      json: {
        body: {
          company: payload.company_keys,
          user: payload.user_keys,
          traits: payload.traits,
          event: payload.event_name
        },
        event_type: 'track'
      }
    })
  }
}

export default action
