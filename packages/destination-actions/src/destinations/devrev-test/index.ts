import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import streamEvent from './streamEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Devrev Test',
  slug: 'actions-devrev-test',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      devOrgId:{
        type: 'string',
        label: 'DevOrg ID',
        description: 'DevOrg ID',
        required: true,
      },
      apiKey: {
        type: 'password',
        label: 'PAT',
        description: 'DevOrg PAT Token',
        required: true
      }
    }
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // }
  },

  // NOT SURE IF WE NEED THIS
  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },
  extendRequest({ settings }) {
    return {
      headers: {
        authorization: `Bearer ${settings?.apiKey}`
      }
    }
  },
  actions: {
    streamEvent
  }
}

export default destination
