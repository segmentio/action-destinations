import { type DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Nudge (Actions)',
  slug: 'actions-nudge',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apikey: {
        label: 'API Key',
        description: 'Private Backend API Key',
        type: 'string',
        required: true,
      },
      platform: {
        label: 'Platform',
        description: 'Platform for the API call',
        type: 'string',
        required: true,
        default: '17', // 17 = Segment
      }
    },
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    //   return true;
    // }
  },

  presets: [],
  actions: {
    trackEvent,
    identifyUser,
  }
}

export default destination
