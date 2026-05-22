import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { testAuthentication, createAudience, getAudience } from './functions'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'MNTN Audiences',
  slug: 'actions-mntn-audiences',
  mode: 'cloud',

  description:
    'Send Segment Engage audience membership data to MNTN. Syncs users into and out of MNTN audience segments using identity signals including email, phone, IP address, and Mobile Advertising ID (MAID).',

  authentication: {
    scheme: 'custom',
    fields: {
      advertiser_id: {
        label: 'Advertiser ID',
        description:
          'Your MNTN Advertiser ID, provided when you register as an MNTN advertiser. Contact your MNTN account manager if you need help locating this.',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'API Key',
        description:
          'Your MNTN Audience API key, issued via the MNTN Integrations Marketplace. Treat this value as a secret — do not share it or commit it to source control.',
        type: 'password',
        required: true
      }
    },

    testAuthentication: (request) => {
      return testAuthentication(request)
    }
  },

  extendRequest({ settings: { api_key } }) {
    return {
      headers: {
        Authorization: `Bearer ${api_key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    }
  },

  audienceFields: {
    segment_id: {
      label: 'MNTN Segment ID',
      description:
        'The ID of a pre-existing MNTN audience segment to sync to. If left blank, a new MNTN segment will be created automatically when this destination is enabled for an audience.',
      type: 'string'
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
    syncAudience
  }
}

export default destination
