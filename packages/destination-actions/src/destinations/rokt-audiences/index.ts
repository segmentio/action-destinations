import { RetryableError } from '@segment/actions-core'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import upsertCustomAudiences from './upsertCustomAudiences'
import { CONSTANTS } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Rokt Audiences (Actions)',
  slug: 'actions-rokt-audiences',
  mode: 'cloud',
  description: `
  This destination allows user to engage audiences using Rokt public API.
  User can select actions-rokt-audiences as destination when creating engage->audience in segment,
  if they intend to create/update custom audiences in Rokt data platform.  
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
      const res = await request(CONSTANTS.ROKT_API_BASE_URL + CONSTANTS.ROKT_API_AUTH_ENDPOINT, {
        method: 'GET',
        headers: {
          Authorization: `${settings.apiKey}`
        }
      })

      if (res.status !== 200) throw new RetryableError(`Rokt API key authentication check failed`)
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { Authorization: `${settings.apiKey}` }
    }
  },
  actions: {
    upsertCustomAudiences
  }
}

export default destination
