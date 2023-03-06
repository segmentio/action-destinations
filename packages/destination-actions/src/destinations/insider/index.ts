import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { API_BASE, UPSERT_ENDPOINT } from './insider-helpers'

import updateUserProfile from './updateUserProfile'
import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Insider',
  slug: 'actions-insider',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      account_name: {
        label: 'Account Name',
        description:
          'You can get your Account Name via Insider Inone Panel > Settings > Inone Settings > Account Preferences.',
        type: 'string',
        required: true
      },
      ucd_key: {
        label: 'API Key',
        description: 'You can get your API Key via Insider Inone Panel > Settings > Preferences > Integration Settings',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request) => {
      const data = await request(`${API_BASE}${UPSERT_ENDPOINT}`)
      if (data.status === 200) {
        return true
      }

      throw new Error('Authentication failed')
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { 'X-PARTNER-NAME': settings.account_name, 'X-REQUEST-TOKEN': settings.ucd_key }
    }
  },

  actions: {
    updateUserProfile,
    trackEvent
  }
}

export default destination
