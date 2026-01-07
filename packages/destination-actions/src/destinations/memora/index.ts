import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import upsertProfile from './upsertProfile'

export const API_VERSION = 'v1'
export const BASE_URL = 'https://memory.dev.twilio.com' //TODO: change to production base URL

const destination: DestinationDefinition<Settings> = {
  name: 'Memora',
  slug: 'actions-memora',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
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
        // Simple request to validate base URL is accessible
        await request(`${BASE_URL}/${API_VERSION}/ControlPlane/Stores?pageSize=1`, {
          method: 'GET',
          headers: {
            ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
          }
        })
        return true
      } catch (error) {
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

  actions: {
    upsertProfile
  }
}

export default destination
