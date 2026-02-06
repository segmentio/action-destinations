import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import upsertProfile from './upsertProfile'
import { API_VERSION, BASE_URL } from './versioning-info'

const destination: DestinationDefinition<Settings> = {
  name: 'Memora',
  slug: 'actions-memora',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'API Key',
        description: 'API Key for Basic Authentication',
        type: 'string',
        required: true
      },
      password: {
        label: 'API Secret',
        description: 'API Secret for Basic Authentication',
        type: 'password',
        required: true
      },
      twilioAccount: {
        label: 'Twilio Account ID',
        description: 'Twilio Account ID for X-Pre-Auth-Context header (optional)',
        type: 'string',
        required: false
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`${BASE_URL}/${API_VERSION}/ControlPlane/Stores?pageSize=1`, {
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
