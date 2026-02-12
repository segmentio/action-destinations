import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { adAccountId } from './fields'
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
    audienceDescription: {
      type: 'string',
      label: 'Description',
      description: 'A brief description about your audience.',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      return createAudience(request, createAudienceInput)
    },
    async getAudience(request, getAudienceInput) {
      return getAudience(request, getAudienceInput)
    }
  },
  actions: {
    sync
  },
  presets
}

export default destination
