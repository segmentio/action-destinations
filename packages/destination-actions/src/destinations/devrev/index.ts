import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createWork from './createWork'

import createRevUser from './createRevUser'
import { devrevApiPaths, getBaseUrl } from './utils'

import streamEvent from './streamEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'DevRev',
  slug: 'actions-devrev',
  mode: 'cloud',
  description: 'Send Segment events via Cloud Mode to DevRev to create work items and RevUsers',
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `${settings.apiKey}` }
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
        description:
          'A comma separated list of email domains to blacklist from being used to search for/create Accounts.',
        type: 'string',
        required: false,
        default: 'gmail.com,hotmail.com,outlook.com,yahoo.com,aol.com,icloud.com,me.com,msn.com'
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      const url = `${getBaseUrl(settings)}${devrevApiPaths.authTest}`
      return request(url)
    }
  },
  actions: {
    createWork,
    createRevUser,
    streamEvent
  }
}

export default destination
