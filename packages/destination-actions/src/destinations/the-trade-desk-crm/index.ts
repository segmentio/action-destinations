import type { AudienceDestinationDefinition, ModifiedResponse } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

import syncAudience from './syncAudience'
const API_VERSION = 'v3'
const BASE_URL = `https://api.thetradedesk.com/${API_VERSION}`

export interface CREATE_API_RESPONSE {
  CrmDataId: string
  FirstPartyDataId: number
}

export interface GET_API_RESPONSE {
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

export interface GET_CRMS_API_RESPONSE {
  Segments: [
    {
      CrmDataId: string
      SegmentName: string
      Region: string
      FirstPartyDataId: number
    }
  ]
  PagingToken: string
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'The Trade Desk Crm',
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
  audienceFields: {
    region: {
      type: 'string',
      label: 'Region',
      description: 'Region of your audience.'
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const advertiserId = createAudienceInput.settings.advertiser_id
      const authToken = createAudienceInput.settings.auth_token
      const region = createAudienceInput.audienceSettings?.region

      if (audienceName?.length == 0) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response: ModifiedResponse<CREATE_API_RESPONSE> = await request(`${BASE_URL}/crmdata/segment`, {
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

      return {
        externalId: response.data.CrmDataId
      }
    },
    async getAudience(request, getAudienceInput) {
      const crmDataId = getAudienceInput.externalId
      const advertiserId = getAudienceInput.settings.advertiser_id
      const authToken = getAudienceInput.settings.auth_token

      const response: ModifiedResponse<GET_API_RESPONSE> = await request(
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
