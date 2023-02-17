import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { apiBaseUrl } from './properties'

import trackEvent from './trackEvent'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track User Actions',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'trackEvent',
    mapping: {
      ...defaultValues(trackEvent.fields),
      action_name: {
        '@if': {
          exists: { '@path': '$.properties.action_name' },
          then: { '@path': '$.properties.action_name' },
          else: { '@path': '$.properties.title' }
        }
      }
    }
  },
  {
    name: 'Screen Calls',
    subscribe: 'type = "screen"',
    partnerAction: 'trackEvent',
    mapping: {
      ...defaultValues(trackEvent.fields),
      action_name: {
        '@if': {
          exists: { '@path': '$.properties.action_name' },
          then: { '@path': '$.properties.action_name' },
          else: { '@path': '$.properties.title' }
        }
      }
    }
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'LiveLike',
  slug: 'actions-livelike-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      clientId: {
        label: 'Client ID',
        description: 'Your LiveLike Application Client ID.',
        type: 'string',
        required: true
      },
      producerToken: {
        label: 'Producer Token',
        description: 'Your LiveLike Producer token.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return request(`${apiBaseUrl}/applications/${settings.clientId}/validate-app/`, {
        method: 'get'
      })
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.producerToken}` }
    }
  },
  presets,
  actions: {
    trackEvent
  }
}

export default destination
