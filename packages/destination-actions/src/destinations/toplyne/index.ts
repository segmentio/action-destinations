import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendUserProfiles from './sendUserProfiles'

import sendAccountProfiles from './sendAccountProfiles'

import { baseUrl } from './constants'
import sendEvents from './sendEvents'

const destination: DestinationDefinition<Settings> = {
  name: 'Toplyne',
  slug: 'toplyne',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Your Toplyne API Key',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request(`${baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`
        }
      })
    }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`
      },
      method: 'POST'
    }
  },

  actions: {
    sendUserProfiles,
    sendAccountProfiles,
    sendEvents
  }
}

export default destination
