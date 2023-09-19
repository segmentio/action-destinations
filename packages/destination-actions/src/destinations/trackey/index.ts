import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

//const base = 'https://6550-2-139-22-73.ngrok-free.app/';
const base = 'https://app.trackey.io/'
const endpoint = base + 'public-api/integrations/segment/webhook'

const destination: DestinationDefinition<Settings> = {
  name: 'Trackey',
  slug: 'actions-trackey',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Trackey API Key',
        type: 'string'
      }
    }
  },
  extendRequest: ({ settings }) => {
    if (!settings.apiKey) throw new Error('The apiKey field is required')

    return {
      headers: {
        'api-key': settings.apiKey
      }
    }
  },
  onDelete: async () => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    return true
  },
  actions: {
    track: {
      title: 'track',
      description: 'Track an event',
      defaultSubscription: 'type = "track"',
      fields: {},
      perform: (request, { settings, payload }) => {
        if (!settings.apiKey) throw new Error('The apiKey field is required')

        return request(endpoint, {
          method: 'POST',
          json: payload,
          headers: {
            'Content-Type': 'application/json',
            api_key: settings.apiKey
          }
        })
      }
    },
    identify: {
      title: 'Identify',
      description: 'Identify a user',
      defaultSubscription: 'type = "identify"',
      fields: {},
      perform: (request, { settings, payload }) => {
        if (!settings.apiKey) throw new Error('The apiKey field is required')

        return request(endpoint, {
          method: 'POST',
          json: payload,
          headers: {
            'Content-Type': 'application/json',
            api_key: settings.apiKey
          }
        })
      }
    },
    group: {
      title: 'Group',
      description: 'Group a user',
      defaultSubscription: 'type = "group"',
      fields: {},
      perform: (request, { settings, payload }) => {
        if (!settings.apiKey) throw new Error('The apiKey field is required')

        return request(endpoint, {
          method: 'POST',
          json: payload,
          headers: {
            'Content-Type': 'application/json',
            api_key: settings.apiKey
          }
        })
      }
    }
  }
}

export default destination
