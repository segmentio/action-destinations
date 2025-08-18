import { IntegrationError, AudienceDestinationDefinition, RequestClient, defaultValues } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'

import syncAudience from './syncAudience'
import { GetAudienceResp } from './types'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Iterable Lists',
  slug: 'actions-iterable-lists',
  mode: 'cloud',
  description: 'Sync users to Iterable Lists',

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
      description: 'The numeric Campaign ID to associate with the unsubscribe. Only valid for unsubscribe action.',
      type: 'number',
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },
    async createAudience(request, { settings, personas }) {
      if (!personas) {
        throw new IntegrationError('Missing computation parameters: Key', 'MISSING_REQUIRED_FIELD', 422)
      }
      if (!personas.computation_key) {
        throw new IntegrationError('Missing computation parameters: Key', 'MISSING_REQUIRED_FIELD', 422)
      }
      const audienceKey = personas.computation_key
      let externalId = await getAudience(request, settings, audienceKey)
      if (externalId) {
        return { externalId }
      }
      externalId = await createAudience(request, settings, audienceKey)
      return { externalId }
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
  },
  presets: [
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

async function getAudience(
  request: RequestClient,
  settings: Settings,
  audienceKey: string
): Promise<string | undefined> {
  const response = await request('https://api.iterable.com/api/lists', {
    method: 'GET',
    skipResponseCloning: true,
    headers: { 'Api-Key': settings.apiKey }
  })

  const json: GetAudienceResp = (await response.data) as GetAudienceResp
  const audience = json.lists.find((list: { id: number; name: string }) => list.name === audienceKey)
  return audience?.id.toString() ?? undefined
}

async function createAudience(request: RequestClient, settings: Settings, audienceKey: string): Promise<string> {
  const response = await request('https://api.iterable.com/api/lists', {
    method: 'POST',
    headers: { 'Api-Key': settings.apiKey },
    json: {
      name: audienceKey
    }
  })
  const audience = await response.json()
  return audience.listId
}

export default destination
