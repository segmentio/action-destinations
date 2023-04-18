import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import { BASE_URL, TIKTOK_API_VERSION } from '../constants'
import type { GetAudienceAPIResponse, APIResponse } from '../types'
import { DynamicFieldResponse } from '@segment/actions-core'

interface AdvertiserInfoItem {
  advertiser_id: string
  name: string
}

interface AdvertiserInfoResponse {
  code: number
  message: string
  data: {
    list: AdvertiserInfoItem[]
  }
}

interface AdvertiserInfoError {
  response: {
    data: {
      code: number
      message: string
    }
  }
}

export class TikTokAudiences {
  request: RequestClient
  selectedAdvertiserID?: string

  constructor(request: RequestClient, selectedAdvertiserID?: string) {
    this.request = request
    this.selectedAdvertiserID = selectedAdvertiserID
  }

  async getUserInfo(): Promise<ModifiedResponse<APIResponse>> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/user/info/`, {
      method: 'GET'
    })
  }

  async getAudiences(page_number: number, page_size: number): Promise<GetAudienceAPIResponse> {
    const response: ModifiedResponse<GetAudienceAPIResponse> = await this.request(
      `${BASE_URL}${TIKTOK_API_VERSION}/dmp/custom_audience/list/`,
      {
        method: 'GET',
        searchParams: {
          advertiser_id: this.selectedAdvertiserID ?? '',
          page: page_number,
          page_size: page_size
        }
      }
    )

    return response.data
  }

  async batchUpdate(elements: {}): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`, {
      method: 'POST',
      json: elements,
      throwHttpErrors: false
    })
  }

  fetchAdvertisers = async (advertiser_ids: string[]): Promise<DynamicFieldResponse> => {
    if (!advertiser_ids.length) {
      return {
        choices: [],
        error: {
          message: 'Sign in via OAuth on the settings page to load advertisers.',
          code: 'NOT_LOGGED_IN'
        }
      }
    }
    try {
      const result = await this.request<AdvertiserInfoResponse>(`${BASE_URL}${TIKTOK_API_VERSION}/advertiser/info/`, {
        method: 'GET',
        searchParams: {
          advertiser_ids: JSON.stringify(advertiser_ids)
        }
      })

      if (result.data.code !== 0) {
        throw {
          message: result.data.message,
          code: result.data.code
        }
      }

      const choices = result.data.data.list.map((item) => {
        return {
          label: item.name,
          value: item.advertiser_id
        }
      })

      return {
        choices: choices
      }
    } catch (err) {
      const choices = advertiser_ids.map((id) => {
        return {
          label: id,
          value: id
        }
      })

      return {
        choices: choices,
        error: {
          message:
            (err as AdvertiserInfoError).response.data.message ?? 'An error occurred while fetching advertisers.',
          code: (err as AdvertiserInfoError).response.data.code.toString() ?? 'FETCH_ADVERTISERS_ERROR'
        }
      }
    }
  }
}
