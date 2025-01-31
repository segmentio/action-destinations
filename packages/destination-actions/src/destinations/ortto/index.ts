import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'
import upsertContactProfile from './upsertContactProfile'
import OrttoClient from './ortto-client'

import trackActivity from './trackActivity'

const destination: DestinationDefinition<Settings> = {
  name: 'Ortto',
  slug: 'actions-ortto',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Ortto API key',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const client: OrttoClient = new OrttoClient(request)
      return await client.testAuth(settings)
    }
  },
  extendRequest({ settings }) {
    if (process?.env?.ORTTO_API_KEY) {
      settings.api_key = process?.env?.ORTTO_API_KEY
    }
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`
      },
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    }
  },
  actions: {
    upsertContactProfile,
    trackActivity
  }
}

export default destination
