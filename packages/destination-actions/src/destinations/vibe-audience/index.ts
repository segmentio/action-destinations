import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sync from './sync'
import { BASE_URL, API_VERSION } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Vibe Audience',
  slug: 'actions-vibe-audience',
  mode: 'cloud',
  description: 'Sync Segment Engage Audiences to Vibe',

  authentication: {
    scheme: 'custom',
    fields: {
      advertiserId: {
        type: 'string',
        label: 'Advertiser ID',
        description: 'Your Vibe advertiser ID.',
        required: true
      },
      authToken: {
        type: 'string',
        label: 'Auth Token',
        description: 'Your Vibe authentication token.',
        required: true,
        format: 'password'
      }
    },

    testAuthentication: async (request, { settings }) => {
      return request(`${BASE_URL}/${API_VERSION}/webhooks/twilio/${settings.advertiserId}`, {
        method: 'GET'
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'x-api-key': settings.authToken,
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    sync
  }
}

export default destination
