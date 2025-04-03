import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'
import upsertContactProfile from './upsertContactProfile'
import OrttoClient from './ortto-client'

import trackActivity from './trackActivity'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Ortto (Actions)',
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
  audienceFields: {
    audienceId: {
      label: 'Audience Id',
      description: `The default Audience ID to which contacts will be added. This audience takes precedence over the newly created list segment that is automatically generated when attaching this destination to an audience.`,
      type: 'string'
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    createAudience: async (request, { settings, audienceSettings, audienceName }) => {
      const client: OrttoClient = new OrttoClient(request)
      return await client.createAudience(settings, audienceSettings, audienceName)
    },
    getAudience: async (request, { settings, audienceSettings, externalId }) => {
      const client: OrttoClient = new OrttoClient(request)
      return await client.getAudience(settings, audienceSettings, externalId)
    }
  },
  actions: {
    upsertContactProfile,
    trackActivity
  }
}

export default destination
