import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyContact from './identifyContact'
import groupIdentifyContact from './groupIdentifyContact';
import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Outfunnel',
  slug: 'actions-outfunnel',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        label: 'API Token',
        description: 'Outfunnel API Token. This is found under Account',
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

  actions: {
    trackEvent,
    groupIdentifyContact,
    identifyContact
  }
}

export default destination
