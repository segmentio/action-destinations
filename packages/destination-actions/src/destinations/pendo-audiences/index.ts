import { AudienceDestinationDefinition, IntegrationError, defaultValues } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { createSegment, getSegment } from './functions'
import { CONSTANTS } from './constants'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Pendo Audiences',
  slug: 'actions-pendo-audiences',
  mode: 'cloud',
  description: 'Sync Segment Engage Audiences to Pendo Segments.',
  authentication: {
    scheme: 'custom',
    fields: {
      integrationKey: {
        label: 'Integration Key',
        description: 'Your Pendo Integration Key. Found in Pendo under Settings > Integrations > Integration Keys.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request) => {
      return await request(`${CONSTANTS.API_BASE_URL}/api/v1/feature`, {
        method: 'GET',
        skipResponseCloning: true
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'x-pendo-integration-key': settings.integrationKey,
        'Content-Type': 'application/json'
      }
    }
  },
  audienceFields: {
    audienceName: {
      label: 'Pendo Segment Name',
      description: 'A name for the Pendo Segment. Leave blank to use the Segment audience name.',
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
      const { audienceName, audienceSettings } = createAudienceInput

      const segmentName = audienceSettings?.audienceName ?? audienceName

      if (!segmentName) {
        throw new IntegrationError('A Pendo Segment name is required', 'MISSING_REQUIRED_FIELD', 422)
      }

      const segmentId = await createSegment(request, segmentName)
      return { externalId: segmentId }
    },
    async getAudience(request, getAudienceInput) {
      const { externalId } = getAudienceInput
      const segmentId = await getSegment(request, externalId)
      return { externalId: segmentId }
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
