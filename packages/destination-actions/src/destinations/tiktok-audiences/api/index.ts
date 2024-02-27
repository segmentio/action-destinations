import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import { BASE_URL, TIKTOK_API_VERSION } from '../constants'
import type { GetAudienceAPIResponse, APIResponse, CreateAudienceAPIResponse, AudienceInfoError } from '../types'
import { DynamicFieldResponse } from '@segment/actions-core'
import type { Payload } from '../createAudience/generated-types'
import type { Audiences } from '../types'

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

  fetchAudiences = async (selected_advertiser_id: string): Promise<DynamicFieldResponse> => {
    if (!selected_advertiser_id || !selected_advertiser_id.length) {
      return {
        choices: [],
        error: {
          message: 'Please select Advertiser ID first to get list of Audience IDs.',
          code: 'FIELD_NOT_SELECTED'
        }
      }
    }
    try {
      const response: Array<Audiences> = []
      let page_number = 1
      let total_page = 1
      while (page_number <= total_page) {
        const result = await this.request<GetAudienceAPIResponse>(
          `${BASE_URL}${TIKTOK_API_VERSION}/dmp/custom_audience/list/`,
          {
            method: 'GET',
            searchParams: {
              advertiser_id: selected_advertiser_id,
              page: page_number,
              page_size: '100'
            }
          }
        )

        if (result.data.code !== 0) {
          throw {
            message: result.data.message,
            code: result.data.code
          }
        }

        total_page = result.data?.data?.page_info?.total_page || 1
        page_number++
        result.data.data.list.forEach((item) => {
          response.push(item)
        })
      }

      const choices = response?.map((item) => {
        return {
          label: item.name,
          value: item.audience_id
        }
      })

      return {
        choices: choices
      }
    } catch (err) {
      return {
        choices: [],
        error: {
          message: (err as AudienceInfoError).message ?? 'An error occurred while fetching audiences.',
          code: (err as AudienceInfoError).code.toString() ?? 'FETCH_AUDIENCE_ERROR'
        }
      }
    }
  }

  async createAudience(payload: Payload): Promise<ModifiedResponse<CreateAudienceAPIResponse>> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/segment/audience/`, {
      method: 'POST',
      json: {
        custom_audience_name: payload.custom_audience_name,
        advertiser_id: this.selectedAdvertiserID,
        id_type: payload.id_type,
        action: 'create'
      }
    })
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
