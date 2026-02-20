import { AudienceDestinationDefinition, defaultValues, IntegrationError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'
import syncAudience from './syncAudience'
import { getEndpointByRegion, createAudience, getAudience } from './functions'
import { ID_TYPES } from './constants'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Amplitude Cohorts',
  slug: 'actions-amplitude-cohorts',
  mode: 'cloud',
  description: 'Sync Segment Engage audiences to Amplitude Cohorts',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Amplitude project API key. You can find this key in the "General" tab of your Amplitude project.',
        type: 'password',
        required: true
      },
      secret_key: {
        label: 'Secret Key',
        description: 'Amplitude project secret key. You can find this key in the "General" tab of your Amplitude project.',
        type: 'password',
        required: true
      },
      app_id: {
        label: 'Amplitude App ID',
        description: 'The Amplitude App ID for the cohort you want to sync to. You can find this in the "General" tab of your Amplitude project.',
        type: 'string',
        required: true
      },
      owner_email: {
        label: 'Cohort Owner Email',
        description: 'The email of the user who will own the cohorts in Amplitude. This can be overriden per Audience, but if left blank, all cohorts will be owned by this user.',
        type: 'string',
        format: 'email',
        required: true
      },
      endpoint: {
        label: 'Endpoint Region',
        description: 'The region to send your data.',
        type: 'string',
        format: 'text',
        required: true,
        choices: [
          {
            label: 'North America',
            value: 'north_america'
          },
          {
            label: 'Europe',
            value: 'europe'
          }
        ],
        default: 'north_america'
      }
    },
    testAuthentication: (request, { settings }) => {
      const { 
        endpoint 
      } = settings
      const baseUrl = getEndpointByRegion('usersearch', endpoint)
      return request(`${baseUrl}?user=testUser@example.com`)
    }
  },
  extendRequest({ settings }) {
    const { api_key, secret_key } = settings
    return {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${api_key}:${secret_key}`).toString('base64')}` 
      }
    }
  },
  audienceFields: {
    owner_email: {
      label: 'Cohort Owner Email',
      description: 'The email of the user who will own the cohort in Amplitude. This will override the default owner email set in the authentication settings for this specific cohort.',
      type: 'string',
      format: 'email',
      required: false
    },
    audience_name: {
      label: 'Cohort Name',
      description: 'The name of the cohort in Amplitude. This will override the default cohort name which is the snake_case version of the Segment Audience name.',
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
      const { 
        audienceName, 
        settings, 
        audienceSettings: { 
          owner_email,
          audience_name
        } = {}
      } = createAudienceInput

      const externalId = await createAudience(request, settings, audience_name ?? audienceName, owner_email)
      return { externalId }
    },
    async getAudience(request, createAudienceInput) {
      const { 
        externalId,
        settings
      } = createAudienceInput

      await getAudience(request, settings, externalId)
      
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
    }
  ]
}
export default destination
