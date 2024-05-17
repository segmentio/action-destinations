import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import track from './track'

const destination: DestinationDefinition<Settings> = {
  name: 'Trubrics',
  slug: 'actions-trubrics',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'Project API Key',
        description: 'Your Trubrics Project API Key. Can be found in your project settings.',
        type: 'string',
        required: true
      }
    },
    // testAuthentication: (request) => {
    //   return true
    // }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  //   return true
  // },

  actions: {
    track
  }
}

export default destination
