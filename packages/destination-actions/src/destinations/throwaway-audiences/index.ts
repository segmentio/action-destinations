import { AudienceDestinationDefinition, IntegrationError, RequestClient, defaultValues } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'

const BASE_URL = 'https://api.throwaway.example.com/v1'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Throwaway Audiences (Actions)',
  slug: 'actions-throwaway-audiences',
  mode: 'cloud',
  description: 'Throwaway audience destination used to validate audienceConfig registration.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        type: 'password',
        description: 'The API key for your Throwaway account.',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`${BASE_URL}/me`)
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        Accept: 'application/json'
      }
    }
  },
  audienceFields: {
    listName: {
      label: 'List Name',
      description: 'A list name to create. If not provided the Segment Audience name will be used.',
      type: 'string',
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const name = createAudienceInput?.audienceSettings?.listName ?? createAudienceInput.audienceName

      if (!name) {
        throw new IntegrationError('An audience list name is required', 'MISSING_REQUIRED_FIELD', 422)
      }

      const externalId = await getAudienceIdByName(request, name)
      if (externalId) {
        return { externalId }
      }

      const response = await request(`${BASE_URL}/lists`, {
        method: 'POST',
        throwHttpErrors: false,
        json: { name }
      })
      const json = (await response.json()) as { id: string }
      return { externalId: json.id }
    },
    async getAudience(request, getAudienceInput) {
      const externalId = await getAudienceIdById(request, getAudienceInput.externalId)
      if (!externalId) {
        throw new IntegrationError(
          `Audience with externalId ${getAudienceInput.externalId} not found`,
          'GET_AUDIENCE_ERROR',
          404
        )
      }
      return { externalId }
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
    }
  ]
}

export async function getAudienceIdByName(request: RequestClient, name: string): Promise<string | undefined> {
  const response = await request(`${BASE_URL}/lists`, {
    method: 'GET',
    throwHttpErrors: false
  })
  const json = (await response.json()) as { result: Array<{ id: string; name: string }> }
  return json.result?.find((list) => list.name === name)?.id ?? undefined
}

export async function getAudienceIdById(request: RequestClient, externalId: string): Promise<string | undefined> {
  const response = await request(`${BASE_URL}/lists/${externalId}`, {
    method: 'GET',
    throwHttpErrors: false
  })
  const json = (await response.json()) as { id: string }
  return json.id === externalId ? externalId : undefined
}

export default destination
