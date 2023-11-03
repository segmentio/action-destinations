import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendUserProfiles from './sendUserProfiles'

import sendAccountProfiles from './sendAccountProfiles'

import { baseUrl } from './constants'
import sendEvents from './sendEvents'

const destination: DestinationDefinition<Settings> = {
  name: 'Toplyne Cloud Mode (Actions)',
  slug: 'actions-toplyne-cloud',
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

  presets: [
    {
      name: 'Send User Profiles',
      subscribe: 'type = "identify"',
      partnerAction: 'sendUserProfiles',
      mapping: defaultValues(sendUserProfiles.fields),
      type: 'automatic'
    },
    {
      name: 'Send Account Profiles',
      subscribe: 'type = "group"',
      partnerAction: 'sendAccountProfiles',
      mapping: defaultValues(sendAccountProfiles.fields),
      type: 'automatic'
    },
    {
      name: 'Send Events',
      subscribe: 'type = "track"',
      partnerAction: 'sendEvents',
      mapping: defaultValues(sendEvents.fields),
      type: 'automatic'
    }
  ],

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
