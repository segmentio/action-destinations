import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createWork from './createWork'
import { baseUrl } from './utils/constants'

import createRevUser from './createRevUser'

const destination: DestinationDefinition<Settings> = {
  name: 'DevRev',
  slug: 'actions-devrev',
  mode: 'cloud',

  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    }
  },
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'DevRev API Key',
        description: 'Your DevRev API Key, generated from the setting page in your DevRev organization.',
        type: 'password',
        required: true
      },
      blacklistedDomains: {
        label: 'Blacklisted Domains',
        description: 'A list of email domains to blacklist from being used to search for/create Accounts.',
        type: 'string',
        required: false,
        multiple: true,
        default: 'gmail.com'
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      const url = `${baseUrl}/operations/dev-users-self`
      return request(url)
    }
  },
  actions: {
    createWork,
    createRevUser
  }
}

export default destination
