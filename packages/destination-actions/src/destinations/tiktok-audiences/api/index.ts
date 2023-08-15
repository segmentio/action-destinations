import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import { BASE_URL, TIKTOK_API_VERSION } from '../constants'
import type { APIResponse } from '../types'

export class TikTokAudiences {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  async getUserInfo(): Promise<ModifiedResponse<APIResponse>> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/user/info/`, {
      method: 'GET'
    })
  }

  async batchUpdate(elements: {}): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`, {
      method: 'POST',
      json: elements,
      throwHttpErrors: false
    })
  }
}
