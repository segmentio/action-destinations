import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { getDomain, createSegment, getSegment } from './functions'
import { REGIONS } from './constants'

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
        description:
          'Your Pendo Integration Key. Found in Pendo under Settings > Integrations > Integration Keys.',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'The region your Pendo account is hosted in.',
        type: 'string',
        required: true,
        choices: (Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((key) => ({
          label: REGIONS[key].name,
          value: REGIONS[key].name
        })),
        default: REGIONS.DEFAULT.name
      }
    },
    testAuthentication: async (request, { settings }) => {
      const { region } = settings
      return await request(`${getDomain(region)}/api/v1/token/verify`, {
        method: 'GET'
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
      description:
        'A name for the Pendo Segment. Leave blank to use the Segment audience name.',
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
        audienceSettings,
        settings: { region }
      } = createAudienceInput

      const segmentName = audienceSettings?.audienceName ?? audienceName

      if (!segmentName) {
        throw new IntegrationError('A Pendo Segment name is required', 'MISSING_REQUIRED_FIELD', 422)
      }

      const segmentId = await createSegment(request, region, segmentName)
      return { externalId: segmentId }
    },
    async getAudience(request, getAudienceInput) {
      const { externalId, settings: { region } } = getAudienceInput
      const segmentId = await getSegment(request, region, externalId)
      return { externalId: segmentId }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
