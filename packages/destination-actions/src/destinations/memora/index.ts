import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import upsertProfile from './upsertProfile'

const API_VERSION = 'v1'

const destination: DestinationDefinition<Settings> = {
  name: 'Memora',
  slug: 'actions-memora',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      url: {
        label: 'Base URL',
        description: 'Base URL for the Memora API.',
        type: 'string',
        format: 'uri',
        required: true,
        default: 'https://api.memora.com'
      },
      serviceId: {
        label: 'Service ID',
        description:
          'A unique Profile Service ID using Twilio Type ID (TTID) format (e.g., mem_service_00000000000000000000000000)',
        type: 'string',
        required: true
      },
      username: {
        label: 'API Key',
        description: 'API Key for Basic Authentication',
        type: 'string',
        required: true
      },
      password: {
        label: 'API Secret',
        description: 'API Secret for Basic Authentication',
        type: 'string',
        required: true
      },
      twilioAccount: {
        label: 'Twilio Account ID',
        description: 'Twilio Account ID for X-Pre-Auth-Context header (optional)',
        type: 'string',
        required: false
      }
    },
    testAuthentication: async (request, { settings }) => {
      // Test authentication by making a request to the Memora API
      try {
        const baseUrl = normalizeBaseUrl(settings.url)

        const response = await request(`${baseUrl}/${API_VERSION}/Services/${settings.serviceId}/Profiles/Bulk`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
          },
          json: {
            profiles: [] // Empty test request
          }
        })

        // Even with empty profiles, if auth is valid, we should get a proper response
        return response.status < 500
      } catch (error) {
        // If it's a 400 with empty profiles, that's actually good - auth worked
        const httpError = error as { response?: { status: number } }
        if (httpError.response?.status === 400) {
          return true
        }
        // Auth failed
        return false
      }
    }
  },

  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  },

  onDelete: async (_request, { settings: _settings, payload: _payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    return true
  },

  actions: {
    upsertProfile
  }
}

export default destination

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}
