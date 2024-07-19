import { IntegrationError, AudienceDestinationDefinition, defaultValues } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'

import upsert from './upsert'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Iterable Lists',
  slug: 'actions-iterable-lists',
  mode: 'cloud',
  description: 'Sync Segment Engage Audiences to Iterable Lists',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description:
          "To obtain the API Key, go to the Iterable app and naviate to Integrations > API Keys. Create a new API Key with the 'Server-Side' type.",
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request('https://api.iterable.com/api/lists', {
        method: 'GET',
        headers: { 'Api-Key': settings.apiKey }
      })
    }
  },

  audienceFields: {
    update_existing_users_only: {
      label: 'TODO',
      description: 'TODO',
      type: 'boolean',
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },
    async createAudience(request, createAudienceInput) {
      const audienceSettings = createAudienceInput.audienceSettings
      const settings = createAudienceInput.settings
      // @ts-ignore type is not defined, and we will define it later
      const personasSettings = audienceSettings.personas
      if (!personasSettings) {
        throw new IntegrationError('Missing computation parameters: Id and Key', 'MISSING_REQUIRED_FIELD', 400)
      }

      const audienceKey = personasSettings.computation_key

      await request('https://api.iterable.com/api/lists', {
        method: 'POST',
        headers: { 'Api-Key': settings.apiKey },
        json: {
          name: audienceKey
        }
      })

      return { externalId: audienceKey }
    },
    async getAudience(request, getAudienceInput) {
      const audienceKey = getAudienceInput.externalId
      if (!audienceKey) {
        throw new IntegrationError('Missing audience id value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response = await request(`https://api.iterable.com/api/lists`, {
        method: 'GET',
        headers: { 'Api-Key': getAudienceInput.settings.apiKey }
      })

      if (response.status === 404) {
        throw new IntegrationError('Audience not found', 'NOT_FOUND', 404)
      }

      for (const listItem of response.data as { id: string; name: string }[]) {
        if (listItem.name === audienceKey) {
          return { externalId: listItem.id }
        }
      }

      throw new IntegrationError('Audience not found', 'PRECONDITION_FAILED', 424)
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { 'Api-Key': settings.apiKey }
    }
  },

  actions: {
    upsert // TODO rename to syncAudience or similar
  },

  presets: [  // TODO remove presets. They don't work when a destination is connected to Engage 
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify"',
      partnerAction: 'upsert',
      mapping: defaultValues(upsert.fields),
      type: 'automatic'
    }
  ]
}

export default destination
