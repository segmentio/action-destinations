import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: 'The Trade Desk Crm',
  slug: 'actions-the-trade-desk-crm',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {}
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // }
  },

  actions: {}
}

export default destination
