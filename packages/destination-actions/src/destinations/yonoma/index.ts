import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import upsertContact from './upsertContact'
import trackEvent from './trackEvent'
import sendEvent from './sendEvent'
import trackPageView from './trackPageView'

const destination: DestinationDefinition<Settings> = {
  name: 'Yonoma',
  slug: 'actions-yonoma',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Yonoma API key.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.yonoma.io/integration/authenticate', {
        method: 'GET'
      })
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        'User-Agent': 'Segment',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      }
    }
  },
  actions: {
    upsertContact,
    trackEvent,
    sendEvent,
    trackPageView
  }
}

export default destination
