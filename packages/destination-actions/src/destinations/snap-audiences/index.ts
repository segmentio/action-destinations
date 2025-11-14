import { AudienceDestinationDefinition, defaultValues, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { CreateAudienceReq, RefreshTokenResponse, SnapAudienceResponse } from './types'
import { ACCESS_TOKEN_URL, DEFAULT_RETENTION_DAYS, SNAP_AUDIENCES_BASE_URL } from './constants'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Snap Audiences (Actions)',
  slug: 'actions-snap-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        label: 'Ad Account ID',
        description: 'The ID of the Snap Ad Account',
        required: true,
        type: 'string'
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request<RefreshTokenResponse>(ACCESS_TOKEN_URL, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
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
      name: 'Associated Entity Added',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Associated Entity Removed',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    },
    {
      name: 'Sync Engage Audience',
      subscribe: 'type = "track" or type = "identify"',
      partnerAction: 'syncAudience',
      mapping: { ...defaultValues(syncAudience.fields)},
      type: 'automatic'
    }
  ],
  audienceFields: {
    customAudienceName: {
      type: 'string',
      label: 'Audience Name',
      description: 'Name for the audience that will be created in Snap. Defaults to the snake_cased Segment audience name if left blank.',
      default: '',
      required: false
    },
    description: {
      type: 'string',
      label: 'Audience Description',
      description: 'Description of for the audience that will be created in Snap.',
      default: '',
      required: false
    },
    retention_in_days: {
      type: 'number',
      label: 'Retention in days',
      description: 'Number of days to retain audience members. (Default retention is lifetime represented as 9999)',
      default: 9999,
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const {
        audienceName,
        settings: { ad_account_id } = {},
        audienceSettings: {
          customAudienceName,
          description,
          retention_in_days
        } = {}
      } = createAudienceInput

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if(!ad_account_id){
        throw new IntegrationError('Missing Ad Account ID. Please configure the Ad Account ID in the destination settings.', 'MISSING_REQUIRED_FIELD', 400)
      }

      const json: CreateAudienceReq = {
        segments: [
          {
            name: customAudienceName || audienceName,
            source_type: 'FIRST_PARTY',
            ad_account_id,
            description: description || `Audience ${audienceName} created by Segment`,
            retention_in_days: retention_in_days || DEFAULT_RETENTION_DAYS
          }
        ]
      }

      const response = await request<SnapAudienceResponse>(`${SNAP_AUDIENCES_BASE_URL}/adaccounts/${ad_account_id}/segments`, {
        method: 'POST',
        json
      })

      return { externalId: response.data.segments[0].segment.id }
    },

    getAudience: async (request, { externalId }) => {
      const response = await request<SnapAudienceResponse>(`${SNAP_AUDIENCES_BASE_URL}/segments/${externalId}`, {
        method: 'GET'
      })

      return { externalId: response.data.segments[0].segment.id }
    }
  }
}

export default destination
