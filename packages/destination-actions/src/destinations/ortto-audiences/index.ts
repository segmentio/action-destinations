import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import OrttoClient from './ortto-client'

import syncAudience from './syncAudience'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Ortto (Audiences)',
  slug: 'actions-ortto-audiences',
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
      }
    }
  },
  audienceFields: {
    audienceName: {
      label: 'Audience Name',
      description: 'The name of the Audience in Ortto',
      type: 'string',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    createAudience: async (request, { settings, audienceName }) => {
      const client: OrttoClient = new OrttoClient(request)
      const audience = await client.createAudience(settings, audienceName)
      return {
        // Segment will save this externalId for subsequent calls
        externalId: audience.id
      }
    },
    getAudience: async (request, { settings, externalId }) => {
      const client: OrttoClient = new OrttoClient(request)
      const audience = await client.getAudience(settings, externalId)
      return {
        externalId: audience.id
      }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
