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
    updateExistingUsersOnly: {
      label: 'Update existing users only',
      description: "Whether to skip operation when the request includes a userId or email that doesn't yet exist in the Iterable project. When true, Iterable ignores requests with unknown userIds and email addresses.",
      type: 'boolean',
      default: false,
      required: false
    },
    channelUnsubscribe: {
      label: 'Global Unsubscribe',
      description: "Unsubscribe email from list's associated channel - essentially a global unsubscribe",
      type: 'boolean',
      default: false,
      required: false
    },
    campaignId: {
      label: 'Campaign ID',
      description: 'Campaign ID to associate with the unsubscribe',
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
    async getAudience(_, getAudienceInput) {
      return  { externalId: getAudienceInput.externalId }
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { 'Api-Key': settings.apiKey }
    }
  },

  actions: {
    upsert // TODO rename to syncAudience or similar
  }
}

export default destination
