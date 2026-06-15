import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendForm from './sendForm'
import { getAccessToken } from './functions'

const destination: DestinationDefinition<Settings> = {
  name: 'Marketo Private',
  slug: 'actions-marketo-private',
  mode: 'cloud',

  authentication: {
    // Custom scheme: each customer supplies their own Marketo client id/secret, so we
    // mint the token inline (see functions.ts) rather than using the platform OAuth flow.
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
      marketo_api_domain: {
        label: 'Marketo API Domain',
        description: 'Your Marketo REST API Domain in this format: https://<your_account_id>.mktorest.com.',
        type: 'string',
        format: 'uri',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Successfully minting a token validates the client id/secret and API domain.
      return getAccessToken(request, settings)
    }
  },

  actions: {
    sendForm
  }
}

export default destination
