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
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },
  extendRequest: ({ settings }) => {
    return { 
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${settings.apiKey}` } 
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
