import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from '../updateAudience/generated-types'

export class LinkedInAudiences {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  // getProfile = async ()

  // getAdAccountUserProfile = async ()

  getDmpSegment = async (settings: Settings, payload: Payload): Promise<ModifiedResponse> => {
    return this.request('https://api.linkedin.com/rest/dmpSegments', {
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
    return this.request('https://api.linkedin.com/rest/dmpSegments', {
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
    return this.request(`https://api.linkedin.com/rest/dmpSegments/${dmpSegmentId}/users`, {
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
