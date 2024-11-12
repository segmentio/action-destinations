import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import upsertCustomAudiences from './upsertCustomAudiences'
import { CONSTANTS } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Rokt Audiences (Actions)',
  slug: 'actions-rokt-audiences',
  mode: 'cloud',
  description: `
  This destination allows user to engage audiences using Rokt public API.
  User can connect Rokt Audiences (Actions) as a destination to their Engage Audience in segment,
  which will create/update custom audiences in the Rokt data platform.  
  `,
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key provided by Rokt integration',
        description: 'APIKey used for Rokt API authorization before sending custom audiences data',
        type: 'password',
        required: true
      }
    },

    testAuthentication: async (request, { settings }) => {
      return request(CONSTANTS.ROKT_API_BASE_URL + CONSTANTS.ROKT_API_AUTH_ENDPOINT, {
        method: 'GET',
        headers: {
          Authorization: `${settings.apiKey}`
        }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { Authorization: `${settings.apiKey}` }
    }
  },
  actions: {
    upsertCustomAudiences
  },
  presets: [
    {
      name: 'Sync Engage Audience to Rokt',
      subscribe: 'type = "track" or type = "identify"',
      partnerAction: 'upsertCustomAudiences',
      mapping: defaultValues(upsertCustomAudiences.fields),
      type: 'automatic'
    }
  ]
}

export default destination
