import { AudienceDestinationDefinition, defaultValues } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'
import syncAudience from './syncAudience'
import { getEndpointByRegion } from './functions'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Amplitude Cohorts',
  slug: 'actions-amplitude-cohorts',
  mode: 'cloud',
  description: 'Sync Segment Engage audiences to Amplitude Cohorts',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Amplitude project API key. You can find this key in the "General" tab of your Amplitude project.',
        type: 'password',
        required: true
      },
      secretKey: {
        label: 'Secret Key',
        description:
          'Amplitude project secret key. You can find this key in the "General" tab of your Amplitude project.',
        type: 'password',
        required: true
      },
      endpoint: {
        label: 'Endpoint Region',
        description: 'The region to send your data.',
        type: 'string',
        format: 'text',
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
        apiKey, 
        secretKey, 
        endpoint 
      } = settings

      const baseUrl = getEndpointByRegion('usersearch', endpoint)
      return request(`${baseUrl}?user=testUser@example.com`, {
        username: apiKey,
        password: secretKey
      })
    }
  },
  audienceFields: {
    cohortName: {
      label: 'Cohort Name',
      description: 'The name of the Amplitude Cohort to sync the Engage audience to.',
      type: 'string',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(_request) {
     
      return {  externalId: '' }
    },
    async getAudience(_request) {
     
      return { externalId: '' }
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
