import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'

import updateProfile from './updateProfile'
import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Batch',
  slug: 'actions-batch',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        label: 'REST API Key',
        description: 'Token used to authorize sending data to the Destination platform',
        type: 'password',
        required: true
      },
      projectKey: {
        label: 'Project Key',
        description: 'The unique project key identifying your project in the Destination platform',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      // Check the authentification
      const response = await request('https://api.batch.com/2.2/profiles/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiToken}`,
          'X-Batch-Project': `${settings.projectKey}`
        }
      })

      // If the response is a status code of 200, this means that authentication is valid
      if (response.status !== 200) {
        throw new Error('Invalid API token or project key')
      }
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'Content-Type': 'application/json', // Content Type
        Authorization: `Bearer ${settings.apiToken}`, // REST API Key
        'X-Batch-Project': `${settings.projectKey}` // Project Key
      },
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    }
  },

  actions: {
    updateProfile,
    trackEvent
  }
}

export default destination
