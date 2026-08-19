import type { RequestClient, ModifiedResponse, Features } from '@segment/actions-core'

import type { Settings } from './generated-types'
import type { Payload } from './updateAudience/generated-types'
import { BASE_URL, LINKEDIN_SOURCE_PLATFORM, getApiVersion } from './constants'
import { LINKEDIN_PROTOCOL_VERSION, SEGMENT_TYPES } from './updateCompanyAudience/constants'
import type { ProfileAPIResponse, AdAccountUserResponse, LinkedInAudiencePayload } from './types'
import type {
  AudienceJSON,
  GetDMPSegmentsResponse,
  LinkedInCompanyAudienceElement,
  LinkedInBatchUpdateResponse
} from './updateCompanyAudience/types'

export class LinkedInAudiences {
  request: RequestClient
  features?: Features

  constructor(request: RequestClient, features?: Features) {
    this.request = request
    this.features = features
  }

  async getProfile(): Promise<ModifiedResponse<ProfileAPIResponse>> {
    return this.request(`${BASE_URL}/me`, {
      method: 'GET'
    })
  }

  async getAdAccountUserProfile(settings: Settings, userId: string): Promise<ModifiedResponse<AdAccountUserResponse>> {
    return this.request(
      `${BASE_URL}/adAccountUsers/account=urn:li:sponsoredAccount:${settings.ad_account_id}&user=urn:li:person:${userId}`,
      {
        method: 'GET'
      }
    )
  }

  async getDmpSegment(settings: Settings, payload: Payload): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/dmpSegments`, {
      method: 'GET',
      searchParams: {
        q: 'account',
        account: `urn:li:sponsoredAccount:${settings.ad_account_id}`,
        sourceSegmentId: payload.personas_audience_key || '',
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM
      }
    })
  }

  async createDmpSegment(settings: Settings, payload: Payload): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/dmpSegments`, {
      method: 'POST',
      json: {
        name: payload.dmp_segment_name,
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
        sourceSegmentId: payload.personas_audience_key,
        account: `urn:li:sponsoredAccount:${settings.ad_account_id}`,
        type: 'USER',
        destinations: [
          {
            destination: 'LINKEDIN'
          }
        ]
      }
    })
  }

  async batchUpdate(dmpSegmentId: string, elements: LinkedInAudiencePayload[]): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/dmpSegments/${dmpSegmentId}/users`, {
      method: 'POST',
      headers: {
        'X-RestLi-Method': 'BATCH_CREATE',
        'LinkedIn-Version': getApiVersion(this.features) // https://learn.microsoft.com/en-us/linkedin/marketing/matched-audiences/create-and-manage-segment-users?view=li-lms-2025-11&tabs=curl
      },
      json: {
        elements
      },
      throwHttpErrors: false
    })
  }

  async getCompanyDmpSegment(
    settings: Settings,
    sourceSegmentId: string
  ): Promise<ModifiedResponse<GetDMPSegmentsResponse>> {
    return this.request(`${BASE_URL}/dmpSegments`, {
      method: 'GET',
      headers: {
        'X-Restli-Protocol-Version': LINKEDIN_PROTOCOL_VERSION,
        'LinkedIn-Version': getApiVersion(this.features)
      },
      searchParams: {
        q: 'account',
        account: `urn:li:sponsoredAccount:${settings.ad_account_id}`,
        sourceSegmentId,
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM
      },
      throwHttpErrors: false
    })
  }

  async createCompanyDmpSegment(settings: Settings, sourceSegmentId: string): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/dmpSegments`, {
      method: 'POST',
      headers: {
        'X-Restli-Protocol-Version': LINKEDIN_PROTOCOL_VERSION,
        'LinkedIn-Version': getApiVersion(this.features)
      },
      json: {
        name: sourceSegmentId,
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
        sourceSegmentId,
        account: `urn:li:sponsoredAccount:${settings.ad_account_id}`,
        type: SEGMENT_TYPES.COMPANY,
        destinations: [
          {
            destination: 'LINKEDIN'
          }
        ]
      },
      throwHttpErrors: false
    })
  }

  async batchUpdateCompanies(
    dmpSegmentId: string,
    json: AudienceJSON<LinkedInCompanyAudienceElement>
  ): Promise<ModifiedResponse<LinkedInBatchUpdateResponse>> {
    return this.request(`${BASE_URL}/dmpSegments/${dmpSegmentId}/companies`, {
      method: 'POST',
      headers: {
        'X-RestLi-Method': 'BATCH_CREATE',
        'X-Restli-Protocol-Version': LINKEDIN_PROTOCOL_VERSION,
        'LinkedIn-Version': getApiVersion(this.features)
      },
      json,
      throwHttpErrors: false
    })
  }
}
