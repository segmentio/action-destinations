import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'
import {defaultValues} from "@segment/actions-core";
import {CONSTANTS} from "./constants";
import * as constants from "constants";

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
      },
      environmentId: {
        label: 'Client side ID',
        description: 'ID of the environment',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // The sdk/goals/{clientID} endpoint returns a 200 if the client ID is valid and a 404 otherwise.
      return Promise.all([
        // request(`https://clientsdk.launchdarkly.com/sdk/goals/${settings.environmentId}`, { method: 'head' }),
        request(`${CONSTANTS.LD_API_BASE_URL}/api/v2/versions`, {
          method: 'GET',
          headers: {
            Authorization: `${settings.apiKey}`
          }
        })
      ])
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { Authorization: `${settings.apiKey}` }
    }
  },
  actions: {
    syncAudience
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  presets: [
    {
      name: 'Sync Engage Audience to LaunchDarkly',
      subscribe: 'type = "identify" or type = "track"',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields)
    }
  ]
}

export default destination
