import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Custom Attributes Sync',
  description: 'Sync Custom Attributes to your Contentstack Experience.',
  defaultSubscription: 'type = "track" or type = "identify"',
  platform: 'web',
  fields: {
    traits: {
      type: 'object',
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.context.traits' }
        }
      },
      label: 'User traits',
      description: 'User Profile traits to send to Contentstack',
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
  perform: (_sdk, { payload, settings }) => {
    const { traits, userId } = payload

    return fetch(`${settings.personalizeEdgeApiBaseUrl}/user-attributes`, {
      method: 'PATCH',
      body: JSON.stringify(traits),
      headers: {
        'x-cs-eclipse-user-uid': userId ?? '',
        'x-project-uid': settings?.personalizeProjectId ?? ''
      }
    })
  }
}

export default action
