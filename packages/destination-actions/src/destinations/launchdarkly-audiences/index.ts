import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'
import {defaultValues} from "@segment/actions-core";

const destination: DestinationDefinition<Settings> = {
  name: 'Launchdarkly Audiences',
  slug: 'actions-launchdarkly-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key provided by the LaunchDarkly integration',
        description: 'APIKey used for LaunchDarkly API authorization before sending custom audiences data',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    syncAudience
  },
  presets: [
    {
      name: 'Sync Engage Audience to LaunchDarkly',
      subscribe: 'type = "track" or type = "identify"',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields)
    }
  ]
}

export default destination
