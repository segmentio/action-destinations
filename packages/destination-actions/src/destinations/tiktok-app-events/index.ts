import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import reportAppEvent from './reportAppEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'TikTok App Events',
  slug: 'tiktok-app-events',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description:
          'Your TikTok Access Token. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to generate an access token via the TikTok Ads Manager or API.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request ) => {
      // Return a request that tests/validates the user's credentials.
      // Send a blank event to events API.
      return request('https://business-api.tiktok.com/open_api/v1.3/pixel/track/', {
        method: 'post',
        json: {
          event: 'Test Event',
          timestamp: '',
          context: {}
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'Access-Token': settings.accessToken,
        'Content-Type': 'application/json'
      }
    }
  },
  presets: [
  ],
  actions: {
    reportAppEvent
  }
}

export default destination
