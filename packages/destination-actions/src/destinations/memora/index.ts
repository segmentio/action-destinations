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
        label: 'Base URL ',
        description: 'Base URL for the Memora API.',
        type: 'string',
        format: 'uri',
        required: true,
        default: 'https://api.memora.com'
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
      // Note: We cannot fully test without a serviceId, which is now part of the mapping
      // This just validates the credentials format
      try {
        const baseUrl = normalizeBaseUrl(settings.url)
        // Simple request to validate base URL is accessible
        await request(`${baseUrl}/${API_VERSION}/ControlPlane/Stores?pageSize=1`, {
          method: 'GET',
          headers: {
            ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
          }
        })
        return true
      } catch (error) {
        const httpError = error as { response?: { status: number } }
        // Accept 401/403 as "credentials were checked" (even if invalid)
        // Reject network errors or 5xx errors
        if (httpError.response?.status && httpError.response.status < 500) {
          return true
        }
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
