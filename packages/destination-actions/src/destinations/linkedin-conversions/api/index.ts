import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import { BASE_URL } from '../constants'
import type { ProfileAPIResponse } from '../types'

export class LinkedInConversions {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  async getProfile(): Promise<ModifiedResponse<ProfileAPIResponse>> {
    return this.request(`${BASE_URL}/me`, {
      method: 'GET'
    })
  }
}
