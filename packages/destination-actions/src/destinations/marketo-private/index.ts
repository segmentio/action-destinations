import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendForm from './sendForm'
import { getAccessToken } from './functions'

const destination: DestinationDefinition<Settings> = {
  name: 'Marketo Private',
  slug: 'actions-marketo-private',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'Your Marketo REST API Client ID.',
        type: 'password',
        required: true
      },
      client_secret: {
        label: 'Client Secret',
        description: 'Your Marketo REST API Client Secret.',
        type: 'password',
        required: true
      },
      marketo_api_domain: {
        label: 'Marketo API Domain',
        description: 'Your Marketo REST API Domain in this format: https://<your_account_id>.mktorest.com.',
        type: 'string',
        format: 'uri',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return getAccessToken(request, settings)
    },
    refreshAccessToken: async (request, { settings }) => {
      return { accessToken: await getAccessToken(request, settings) }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  actions: {
    sendForm
  }
}

export default destination
