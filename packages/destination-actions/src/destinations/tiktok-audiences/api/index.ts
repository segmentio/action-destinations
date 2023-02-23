import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Payload } from '../addUser/generated-types'
import { BASE_URL, TIKTOK_API_VERSION } from '../constants'
import type { GetAudienceAPIResponse, CreateAudienceAPIResponse } from '../types'
import { DynamicFieldResponse } from '@segment/actions-core'
import { stringifyAdvertiserID } from '../functions'

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

  async getAudiences(page_number: number, page_size: number): Promise<ModifiedResponse<GetAudienceAPIResponse>> {
    return this.request(`${BASE_URL}${TIKTOK_API_VERSION}/dmp/custom_audience/list/`, {
      method: 'GET',
      searchParams: {
        advertiser_id: this.selectedAdvertiserID ?? '',
        page: page_number,
        page_size: page_size
      }
    })
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

  /**
   * Returns a list of possible advertisers for the user to select from.
   * Items selected here will be saved to the user mapping, and so every advertiser ID is
   * first "stringified" to prevent conversion to a number.
   * @param advertiser_ids The list of advertiser IDs to fetch names for. This is a list of strings,
   * all of which are purely numeric.
   * @returns A list of ("id_<advertiser_id>", "name") pairs, where "id_<advertiser_id>" is the stringified
   * advertiser ID, and "name" is the advertiser's name. If an error occurs we fallback to returning the
   * list of advertiser IDs we have saved as settings.
   */
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
          value: stringifyAdvertiserID(item.advertiser_id)
        }
      })

      return {
        choices: choices
      }
    } catch (err) {
      const choices = advertiser_ids.map((id) => {
        return {
          label: id,
          value: stringifyAdvertiserID(id)
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
