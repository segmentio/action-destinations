import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import track from './track'

import identifyUser from './identifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Dawn Analytics',
  slug: 'actions-dawn-analytics',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      writeKey: {
        label: 'Dawn write key',
        description: 'Your write key from Dawn Analytics.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://api.dawnai.com/validate-auth`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.writeKey}`
        },
        body: null
      })
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    track,
    identifyUser
  }
}

export default destination
