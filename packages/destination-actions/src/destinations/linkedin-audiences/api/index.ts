import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from '../updateAudience/generated-types'
import { BASE_URL, LINKEDIN_SOURCE_PLATFORM } from '../constants'
import type { ProfileAPIResponse, AdAccountUserResponse } from '../types'

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
        accessPolicy: 'PRIVATE',
        type: 'USER',
        destinations: [
          {
            destination: 'LINKEDIN'
          }
        ]
      }
    })
  }

  async batchUpdate(dmpSegmentId: string, elements: Record<string, string>[]): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/dmpSegments/${dmpSegmentId}/users`, {
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
