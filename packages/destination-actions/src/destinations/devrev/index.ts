import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createWork from './createWork'
import { listPartIdsParams } from './request-params'

const destination: DestinationDefinition<Settings> = {
  name: 'DevRev',
  slug: 'actions-devrev',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'DevRev API Key',
        description: 'Your DevRev API Key, generated from the setting page in your DevRev organization.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      const { url, options } = listPartIdsParams(settings)
      return request(url, options)
    }
  },

  actions: {
    createWork
  }
}

export default destination
