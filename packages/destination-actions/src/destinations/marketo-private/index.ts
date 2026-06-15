import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { getAccessToken } from './functions'

import sendForm from './sendForm'

const destination: DestinationDefinition<Settings> = {
  name: 'Marketo Private',
  slug: 'actions-marketo-private',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
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
      api_endpoint: {
        label: 'API Endpoint',
        description: 'Your Marketo REST API Endpoint in this format: https://<your_account_id>.mktorest.com.',
        type: 'string',
        format: 'uri',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
     
    }
  },

  actions: {
    sendForm
  }
}

export default destination
