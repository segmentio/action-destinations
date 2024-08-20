import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Events Sync',
  description: 'Sync Events to your Contentstack Experience.',
  defaultSubscription: 'type = "track" or type = "identify"',
  platform: 'web',
  fields: {
    userId: {
      type: 'string',
      default: { '@path': '$.userId' },
      label: 'User ID',
      description: 'ID for the user',
      required: false
    },
    event: {
      type: 'string',
      default: { '@path': '$.event' },
      label: 'User Event',
      description: 'User Event',
      required: false
    }
  },
  perform: (_sdk, { payload, settings }) => {
    const { event, userId } = payload

    return fetch(`${settings.personalizeEdgeApiBaseUrl}/events`, {
      method: 'POST',
      body: JSON.stringify([
        {
          eventKey: event,
          type: 'EVENT'
        }
      ]),
      headers: {
        'x-cs-eclipse-user-uid': userId ?? '',
        'x-project-uid': settings.personalizeProjectId
      }
    })
  }
}

export default action
