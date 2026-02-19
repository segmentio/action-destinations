import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import upsertProfile from './upsertProfile'
import { API_VERSION } from './versioning-info'
import { BASE_URL_PRODUCTION, BASE_URL_STAGING } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Memora',
  slug: 'actions-memora',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'API Key',
        description:
          'Your Twilio API Key. You can find this in your [Twilio Console](https://console.twilio.com/) under Account > API Keys & Tokens.',
        type: 'string',
        required: true
      },
      password: {
        label: 'API Secret',
        description:
          'Your Twilio API Secret. This is provided when you create an API Key in your [Twilio Console](https://console.twilio.com/) under Account > API Keys & Tokens.',
        type: 'password',
        required: true
      },
      twilioAccount: {
        label: 'Twilio Account ID',
        description:
          'Your Twilio Account ID. This can be found at the top of your [Twilio Console Dashboard](https://console.twilio.com/).',
        type: 'string',
        required: false
      }
    },
    testAuthentication: (request, { settings }) => {
      const baseUrl = process.env.ACTIONS_MEMORA_ENV === 'production' ? BASE_URL_PRODUCTION : BASE_URL_STAGING
      return request(`${baseUrl}/${API_VERSION}/ControlPlane/Stores?pageSize=1`, {
        method: 'GET',
        username: settings.username,
        password: settings.password,
        headers: {
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        }
      })
    }
  },

  actions: {
    upsertProfile
  }
}

export default destination
