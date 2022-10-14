import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from '../updateAudience/generated-types'
import { BASE_URL } from '../constants'
import type { ProfileAPIResponse, AdAccountUserResponse } from '../types'

export class LinkedInAudiences {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  getProfile = async (): Promise<ModifiedResponse<ProfileAPIResponse>> => {
    return this.request(`${BASE_URL}/me`, {
      method: 'GET'
    })
  }

  getAdAccountUserProfile = async (
    settings: Settings,
    userId: string
  ): Promise<ModifiedResponse<AdAccountUserResponse>> => {
    return this.request(
      `${BASE_URL}/adAccountUsers/account=urn:li:sponsoredAccount:${settings.ad_account_id}&user=urn:li:person:${userId}`,
      {
        method: 'GET'
      }
    )
  }

  getDmpSegment = async (settings: Settings, payload: Payload): Promise<ModifiedResponse> => {
    return this.request(`${BASE_URL}/dmpSegments`, {
      method: 'GET',
      searchParams: {
        q: 'account',
        account: `urn:li:sponsoredAccount:${settings.ad_account_id}`,
        sourceSegmentId: payload.source_segment_id || '',
        sourcePlatform: 'SEGMENT'
      }
    })
  }

  createDmpSegment = async (settings: Settings, payload: Payload): Promise<ModifiedResponse> => {
    return this.request(`${BASE_URL}/dmpSegments`, {
      method: 'POST',
      json: {
        name: payload.dmp_segment_name,
        sourcePlatform: 'SEGMENT',
        sourceSegmentId: payload.source_segment_id,
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

  batchUpdate = async (dmpSegmentId: string, elements: Record<string, string>[]): Promise<ModifiedResponse> => {
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
