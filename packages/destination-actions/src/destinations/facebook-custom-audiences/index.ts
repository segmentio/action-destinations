import type { DestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

const FACEBOOK_API_VERSION = 'v17.0'

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
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const externalIdKey = 'id'
      const { audienceName } = createAudienceInput

      // @ts-ignore will remove exception when audienceSettings work concludes
      const { adAccountId, audienceDescription } = createAudienceInput.audienceSettings

      // @ts-ignore until I figure out how to read Auth Tokens from these kind of requests.
      const accessToken = createAudienceInput.settings.accessToken

      if (audienceName.length === 0) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (adAccountId.length === 0) {
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
    async getAudience(request, getAudienceInput) {
      // TODO: Implement this method
      const externalIdKey = 'externalId'
      const response = await request(`https://graph.facebook.com/${FACEBOOK_API_VERSION}`, {
        method: 'POST',
        json: {
          [externalIdKey]: getAudienceInput.externalId
        }
      })

      const jsonOutput = await response.json()
      if (!jsonOutput[externalIdKey]) {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: jsonOutput[externalIdKey]
      }
    }
  },
  actions: {}
}

export default destination
