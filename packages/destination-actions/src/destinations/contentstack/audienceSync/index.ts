import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Sync',
  description: 'Sync Audiences to your Contentstack Experience.',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    traits: {
      type: 'object',
      default: { '@path': '$.traits' },
      label: 'User traits',
      description: 'User Profile traits to send to Contentstack, for Identify calls'
    },
    properties: {
      type: 'object',
      default: { '@path': '$.properties' },
      label: 'User traits',
      description: 'User Profile traits to send to Contentstack, for Track calls'
    },
    type: {
      type: 'string',
      default: { '@path': '$.type' },
      label: 'Event Type',
      description: 'Type of the event',
      required: true
    },
    userId: {
      type: 'string',
      default: { '@path': '$.userId' },
      label: 'User ID',
      description: 'ID for the user',
      required: true
    }
  },
  perform: (request, { payload, settings }) => {
    const traits = (payload.type === 'track' ? payload.properties : payload.traits) ?? {}
    return request(`${settings.personalizeEdgeApiBaseUrl}/user-attributes`, {
      method: 'patch',
      json: traits,
      headers: {
        'x-cs-eclipse-user-uid': payload?.userId,
        'x-project-uid': settings?.personalizeProjectId ?? ''
      }
    })
  }
}

export default action
