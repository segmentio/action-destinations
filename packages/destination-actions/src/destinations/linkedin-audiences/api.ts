import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { BASE_URL, LINKEDIN_SOURCE_PLATFORM, SEGMENT_TYPES } from './constants'
import type { ProfileAPIResponse, AdAccountUserResponse, LinkedInAudiencePayload, CreateDMPSegmentResponse, GetDMPSegmentResponse, SegmentType } from './types'

export class LinkedInAudiences {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
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

  async getDmpSegment(settings: Settings, sourceSegmentId = ''): Promise<ModifiedResponse<GetDMPSegmentResponse>> {
    return this.request(`${BASE_URL}/dmpSegments`, {
      method: 'GET',
      searchParams: {
        q: 'account',
        account: `urn:li:sponsoredAccount:${settings.ad_account_id}`,
        sourceSegmentId,
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM
      }
    })
  }

  async createDmpSegment(settings: Settings, sourceSegmentId: string, segmentType: SegmentType): Promise<ModifiedResponse<CreateDMPSegmentResponse>> {
    return this.request(`${BASE_URL}/dmpSegments`, {
      method: 'POST',
      json: {
        name: sourceSegmentId,
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
        sourceSegmentId,
        account: `urn:li:sponsoredAccount:${settings.ad_account_id}`,
        type: segmentType,
        destinations: [
          {
            destination: 'LINKEDIN'
          }
        ]
      }
    })
  }

  async batchUpdate(dmpSegmentId: string, elements: LinkedInAudiencePayload[], segmentType: SegmentType): Promise<ModifiedResponse> {
    const url = `${BASE_URL}/dmpSegments/${dmpSegmentId}/${segmentType === SEGMENT_TYPES.COMPANY ? 'companies' : 'users'}`
    return this.request(url, {
      method: 'POST',
      headers: {
        'X-RestLi-Method': 'BATCH_CREATE'
      },
      json: {
        elements
      },
      throwHttpErrors: false
    })
  }
}
