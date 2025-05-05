import { defaultValues, AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import upsertContactProfile from './upsertContactProfile'
import OrttoClient from './ortto-client'

import trackActivity from './trackActivity'

import enterAudience from './enterAudience'

import leaveAudience from './leaveAudience'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Ortto (Actions)',
  slug: 'actions-ortto',
  mode: 'cloud',
  description:
    'The Ortto (Actions) integration lets you send customer data from Segment to Ortto in real time to power campaigns, trigger journeys, and manage audiences with greater flexibility and control.',
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
    audience_id: {
      label: 'Audience Id',
      description: `The default Audience ID to which contacts will be added. This audience takes precedence over the new list Segment automatically creates when attaching this destination to an audience.`,
      type: 'string'
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    createAudience: async (request, { settings, audienceSettings, audienceName }) => {
      const defaultAudienceId = audienceSettings?.audience_id
      if (defaultAudienceId) {
        return { externalId: defaultAudienceId }
      }
      const client: OrttoClient = new OrttoClient(request)
      const audience = await client.createAudience(settings, audienceName)
      return {
        // Segment will save this externalId for subsequent calls
        externalId: audience.id
      }
    },
    getAudience: async (request, { settings, audienceSettings, externalId }) => {
      let audienceId = externalId
      const defaultAudienceId = audienceSettings?.audience_id
      if (defaultAudienceId) {
        audienceId = defaultAudienceId
      }
      const client: OrttoClient = new OrttoClient(request)
      const audience = await client.getAudience(settings, audienceId)
      return {
        externalId: audience.id
      }
    }
  },
  presets: [
    {
      name: upsertContactProfile.title,
      subscribe: 'type = "identify"',
      partnerAction: 'upsertContactProfile',
      mapping: defaultValues(upsertContactProfile.fields),
      type: 'automatic'
    }
  ],
  actions: {
    upsertContactProfile,
    trackActivity,
    enterAudience,
    leaveAudience
  }
}

export default destination
