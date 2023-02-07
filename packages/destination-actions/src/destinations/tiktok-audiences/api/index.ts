import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from '../updateAudience/generated-types'
import { BASE_URL, TIKTOK_API_VERSION } from '../constants'
import type { GetAudienceAPIResponse, CreateAudienceAPIResponse } from '../types'

export class TikTokAudiences {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  async getAudiences(
    settings: Settings,
    page_number: number,
    page_size: number
  ): Promise<ModifiedResponse<GetAudienceAPIResponse>> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/dmp/custom_audience/list/`, {
      method: 'GET',
      searchParams: {
        advertiser_id: settings.advertiser_id,
        page: page_number,
        page_size: page_size
      }
    })
  }

  async createAudience(settings: Settings, payload: Payload): Promise<ModifiedResponse<CreateAudienceAPIResponse>> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/segment/audience/`, {
      method: 'POST',
      json: {
        custom_audience_name: payload.custom_audience_name,
        advertiser_id: settings.advertiser_id,
        id_type: payload.id_type,
        action: 'create'
      }
    })
  }

  async batchUpdate(elements: {}): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`, {
      method: 'POST',
      json: elements
    })
  }
}
