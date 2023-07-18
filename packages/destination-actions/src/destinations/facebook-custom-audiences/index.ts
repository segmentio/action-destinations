import type { DestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

export const FACEBOOK_API_VERSION = 'v17.0'

const destination: DestinationDefinition<Settings> = {
  name: 'Facebook Custom Audiences (Actions)',
  slug: 'actions-facebook-custom-audiences',
  mode: 'cloud',
  description: 'The Facebook Custom Audiences destination.',

  authentication: {
    scheme: 'oauth2',
    fields: {
      placeholder: {
        label: 'Placeholder',
        description: 'Placeholder',
        type: 'string'
      }
    },
    refreshAccessToken: async () => {
      return { accessToken: 'TODO: Implement this' }
    }
  },
  audienceSettings: {
    mode: {
      // TODO: Document modes
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const externalIdKey = 'id'
      const { audienceName } = createAudienceInput

      // @ts-ignore TODO: Remove when audienceSettings work concludes
      const { adAccountId, audienceDescription } = createAudienceInput.audienceSettings

      // @ts-ignore TODO: Remove when we start to read the token from the DB
      const accessToken = createAudienceInput.accessToken

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!adAccountId) {
        throw new IntegrationError('Missing ad account ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const createAudienceUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/act_${adAccountId}/customaudiences`
      const payload = {
        name: audienceName,
        access_token: accessToken,
        description: audienceDescription || '',
        subtype: 'CUSTOM',
        customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
      }

      const response = await request(createAudienceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(payload)
      })

      const r = await response.json()
      if (!r[externalIdKey]) {
        throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: r[externalIdKey]
      }
    },
    async getAudience(_request, _getAudienceInput) {
      // TODO: Implement this method
      return {
        externalId: '42'
      }
    }
  },
  actions: {}
}

export default destination
