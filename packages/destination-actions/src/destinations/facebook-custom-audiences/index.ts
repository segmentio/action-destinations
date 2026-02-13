import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { adAccountId, audienceDescription } from './fields'
import sync from './sync'
import { createAudience, getAudience } from './functions'
import { presets } from './presets'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Facebook Custom Audiences (Actions)',
  slug: 'actions-facebook-custom-audiences',
  mode: 'cloud',
  description: 'The Facebook Custom Audiences destination.',
  authentication: {
    scheme: 'oauth2',
    fields: {
      retlAdAccountId: adAccountId
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  audienceFields: {
    engageAdAccountId: adAccountId,
    audienceDescription
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const { audienceName, audienceSettings: { engageAdAccountId: adAccountId, audienceDescription } = {} } =
        createAudienceInput
      const { data: { externalId: id } = {}, error } = await createAudience(
        request,
        audienceName,
        adAccountId as string,
        audienceDescription
      )
      if (error) {
        throw new IntegrationError(
          error.message || 'Failed to create audience',
          error.code || 'CREATE_AUDIENCE_FAILED',
          400
        )
      }
      return { externalId: id as string }
    },
    async getAudience(request, getAudienceInput) {
      const { externalId } = getAudienceInput
      const { data: { externalId: id } = {}, error } = await getAudience(request, externalId)
      if (error) {
        throw new IntegrationError(error.message || 'Failed to get audience', error.code || 'GET_AUDIENCE_FAILED', 400)
      }
      return { externalId: id as string }
    }
  },
  actions: {
    sync
  },
  presets
}

export default destination
