import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { defaultValues, IntegrationError } from '@segment/actions-core'
import { TaboolaClient } from './syncAudience/client'

import syncAudience from './syncAudience'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Taboola (Actions)',
  slug: 'actions-taboola-actions',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
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
      },
      audience_identifier: {
        label: 'Audience Identifier',
        description: 'The audience identifier from your Taboola account.',
        type: 'string',
        choices: [
          { label: 'Audience Computation Key', value: 'computation_key' },
          { label: 'Audience Name', value: 'audience_name' }
        ],
        required: false,
        default: 'computation_key'
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      return await TaboolaClient.refreshAccessToken(request, settings)
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
      description: 'The alphabetic ID for the Taboola Account to sync to.'
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
      const audienceName =
        createAudienceInput.settings?.audience_identifier === 'computation_key'
          ? createAudienceInput.personas?.computation_key
          : createAudienceInput.audienceName
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
        const accessToken = (await TaboolaClient.refreshAccessToken(request, createAudienceInput.settings)).accessToken

        const response = await request(
          `https://backstage.taboola.com/backstage/api/1.0/${accountId}/audience_onboarding/create`,
          {
            method: 'post',
            json: {
              audience_name: audienceName,
              ttl_in_hours: ttlInHours,
              exclude_from_campaigns: excludeFromCampaigns
            },
            headers: {
              authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const json = await response.json()

        if (!json?.audience_id) {
          throw new IntegrationError(
            `Failed to create Audience in Taboola - responseData.audience_id null or undefined`,
            'AUDIENCE_CREATION_FAILED',
            400
          )
        }

        return {
          externalId: String(json?.audience_id)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new IntegrationError(
          `Failed to create Audience in Taboola ${errorMessage}`,
          'AUDIENCE_CREATION_FAILED',
          400
        )
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
