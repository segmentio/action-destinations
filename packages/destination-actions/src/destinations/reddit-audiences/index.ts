import { defaultValues, AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { CreateAudienceReq, CreateAudienceResp } from './types'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Reddit Audiences',
  slug: 'actions-reddit-audiences',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth-managed',
    fields: {
      ad_account_id: {
        type: 'string',
        label: 'Ad Account ID',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      const authToken = Buffer.from(`${auth.clientId}:${auth.clientSecret}`).toString('base64')

      const res = await request('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'segmentaudienceapi:v1 (by /u/segment_audiences)'
        },
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          grant_type: 'refresh_token'
        })
      })
      const responseData = res.data as { access_token: string }
      return { accessToken: responseData.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  audienceFields: {
    audienceName: {
      label: 'Audience Name',
      description: 'An audience name to display in Reddit',
      type: 'string',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const response = await request<CreateAudienceResp>(
        `https://ads-api.reddit.com/api/v3/ad_accounts/${createAudienceInput.settings.ad_account_id}/custom_audiences`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          json: {
            data: {
              name: createAudienceInput.audienceName,
              type: 'CUSTOMER_LIST'
            }
          } as CreateAudienceReq
        }
      )
      const jsonOutput = await response.json()
      return { externalId: jsonOutput.data.id }
    },
    async getAudience(_, getAudienceInput) {
      return {
        externalId: getAudienceInput.externalId
      }
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

export default destination
