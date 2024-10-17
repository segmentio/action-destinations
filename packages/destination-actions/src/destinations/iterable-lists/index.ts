import { IntegrationError, AudienceDestinationDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'

import syncAudience from './syncAudience'

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
        skipResponseCloning: true,
        headers: { 'Api-Key': settings.apiKey }
      })
    }
  },

  audienceFields: {
    updateExistingUsersOnly: {
      label: 'Update existing users only',
      description:
        'When true, Iterable ignores requests for unknown userIds and email addresses. This field is only relevant for non-email based Iterable projects: For email-based projects users will continue to be created in Iterable if a user is added or removed from a List.',
      type: 'boolean',
      default: false,
      required: false
    },
    globalUnsubscribe: {
      label: 'Global Unsubscribe',
      description:
        "Unsubscribe email from list's associated channel - essentially a global unsubscribe. Only valid for unsubscribe action.",
      type: 'boolean',
      default: false,
      required: false
    },
    campaignId: {
      label: 'Campaign ID',
      description: 'Campaign ID to associate with the unsubscribe. Only valid for unsubscribe action.',
      type: 'string',
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },
    async createAudience(request, createAudienceInput) {
      const settings = createAudienceInput.settings
      const personasSettings = createAudienceInput.personas

      if (!personasSettings) {
        throw new IntegrationError('Missing computation parameters: Key', 'MISSING_REQUIRED_FIELD', 422)
      }

      if (!personasSettings.computation_key) {
        throw new IntegrationError('Missing computation parameters: Key', 'MISSING_REQUIRED_FIELD', 422)
      }

      const audienceKey = personasSettings.computation_key

      // If the list already exists, return its externalId
      const getAudienceResponse = await request('https://api.iterable.com/api/lists', {
        method: 'GET',
        skipResponseCloning: true,
        headers: { 'Api-Key': settings.apiKey }
      })

      const getAudienceResponseJson = await getAudienceResponse.json()
      const existingAudience = (getAudienceResponseJson.lists as { id: number; name: string }[]).find(
        (list: { id: number; name: string }) => list.name === audienceKey
      )

      if (existingAudience) {
        return { externalId: existingAudience.id }
      }

      const createAudienceResponse = await request('https://api.iterable.com/api/lists', {
        method: 'POST',
        headers: { 'Api-Key': settings.apiKey },
        json: {
          name: audienceKey
        }
      })
      const createAudienceResponseJson = await createAudienceResponse.json()

      return { externalId: createAudienceResponseJson.listId }
    },
    async getAudience(_, getAudienceInput) {
      return { externalId: getAudienceInput.externalId }
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { 'Api-Key': settings.apiKey }
    }
  },

  actions: {
    syncAudience
  }
}

export default destination
