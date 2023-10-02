import type { AudienceDestinationDefinition, ModifiedResponse } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

import syncAudience from './syncAudience'
const API_VERSION = 'v3'
const BASE_URL = `https://api.thetradedesk.com/${API_VERSION}`

export interface CreateApiResponse {
  CrmDataId: string
  FirstPartyDataId: number
}

export interface GetApiResponse {
  AdvertiserId: string
  CrmDataId: string
  SegmentName: number
}

export interface Segments {
  CrmDataId: string
  SegmentName: string
  Region: string
  FirstPartyDataId: number
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'The Trade Desk CRM',
  slug: 'actions-the-trade-desk-crm',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      auth_token: {
        label: 'Authentication Token',
        description:
          'Your long-lived Trade Desk authentication token. Please see The Trade Desk’s [authentication documentation](https://api.thetradedesk.com/v3/portal/api/doc/Authentication) for information on how to generate a long-lived API Token via the Manage API Tokens in the developer Portal.',
        type: 'string',
        required: true
      },
      advertiser_id: {
        label: 'Advertiser ID',
        description:
          'The platform ID of the advertiser for which to retrieve the status of the specified CRM data segment.',
        type: 'string',
        required: true
      },
      __segment_internal_engage_force_full_sync: {
        label: 'Force Full Sync',
        description: 'Force Full Sync',
        type: 'boolean',
        required: true,
        default: true
      },
      __segment_internal_engage_batch_sync: {
        label: 'Supports batch sync via ADS',
        description: 'Supports batch sync via ADS',
        type: 'boolean',
        required: true,
        default: true
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'TTD-Auth': `${settings.auth_token}`,
        'Content-Type': 'application/json'
      }
    }
  },
  audienceFields: {
    region: {
      type: 'string',
      label: 'Region',
      description:
        'The geographical region of the CRM data segment based on the origin of PII. Can be US (United States and Canada), EU (European Union and the UK), or APAC (Asia-Pacific)',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: true
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const advertiserId = createAudienceInput.settings.advertiser_id
      const region = createAudienceInput.audienceSettings?.region
      const authToken = createAudienceInput.settings.auth_token

      if (audienceName?.length == 0) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response: ModifiedResponse<CreateApiResponse> = await request(`${BASE_URL}/crmdata/segment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TTD-Auth': authToken
        },
        json: {
          AdvertiserId: advertiserId,
          SegmentName: audienceName,
          Region: region
        }
      })

      if (response.status !== 200) {
        throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: response.data.CrmDataId
      }
    },
    async getAudience(request, getAudienceInput) {
      const crmDataId = getAudienceInput.externalId
      const advertiserId = getAudienceInput.settings.advertiser_id
      const authToken = getAudienceInput.settings.auth_token

      const response: ModifiedResponse<GetApiResponse> = await request(
        `${BASE_URL}/crmdata/segment/${advertiserId}/${crmDataId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'TTD-Auth': authToken
          }
        }
      )

      if (response.status !== 200) {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      const externalId = response.data.CrmDataId

      if (externalId !== getAudienceInput.externalId) {
        throw new IntegrationError(
          "Unable to verify ownership over audience. Segment Audience ID doesn't match The Trade Desk's Audience ID.",
          'INVALID_REQUEST_DATA',
          400
        )
      }

      return {
        externalId: externalId
      }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
