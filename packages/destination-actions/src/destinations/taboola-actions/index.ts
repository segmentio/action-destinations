import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

import syncAudience from './syncAudience'

interface RefreshTokenResponse {
  access_token: string
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Taboola (actions)',
  slug: 'actions-taboola-actions',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'The client ID from your Taboola account.',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'Client Secret',
        description: "The client's secret from your Taboola account.",
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      const res = await request<RefreshTokenResponse>('https://backstage.taboola.com/backstage/oauth/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: settings.client_id,
          client_secret: settings.client_secret,
          grant_type: 'client_credentials'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  },
  audienceFields: {
    account_id: {
      type: 'string',
      label: 'Account ID',
      required: true,
      description: 'The ID for the Taboola Account to sync to.'
    },
    ttl_in_hours: {
      type: 'number',
      label: 'TTL in Hours',
      required: false,
      description: 'The time for which a given user will belong to this audience in hours.',
      default: 8760
    },
    exclude_from_campaigns: {
      type: 'boolean',
      label: 'Exclude from Campaigns',
      required: false,
      description: 'Whether to exclude the audience from campaigns.',
      default: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const ttlInHours = createAudienceInput.audienceSettings?.ttl_in_hours
      const excludeFromCampaigns = createAudienceInput.audienceSettings?.exclude_from_campaigns
      const accountId = createAudienceInput.audienceSettings?.account_id

      if (!audienceName) {
        throw new IntegrationError("Missing 'Audience Name' value", 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!accountId) {
        throw new IntegrationError("Missing 'Account ID' value", 'MISSING_REQUIRED_FIELD', 400)
      }

      try {
        const response = await request(
          `https://backstage.taboola.com/backstage/api/1.0/${accountId}/audience_onboarding/create`,
          {
            method: 'post',
            json: {
              audience_name: audienceName,
              ttl_in_hours: ttlInHours,
              exclude_from_campaigns: excludeFromCampaigns
            }
          }
        )
        const json = await response.json()

        return {
          externalId: json?.audience_id
        }
      } catch (error) {
        throw new IntegrationError('Failed to create Audience in Taboola', 'AUDIENCE_CREATION_FAILED', 400)
      }
    },
    async getAudience(_, getAudienceInput) {
      const audience_id = getAudienceInput.externalId
      if (!audience_id) {
        throw new IntegrationError('Missing audience_id value', 'MISSING_REQUIRED_FIELD', 400)
      }
      return { externalId: audience_id }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
