import type { RequestClient, ModifiedResponse, DynamicFieldResponse } from '@segment/actions-core'
import { BASE_URL } from '../constants'
import type {
  ProfileAPIResponse,
  GetAdAccountsAPIResponse,
  Accounts,
  AccountsErrorInfo,
  GetConversionListAPIResponse,
  Conversions,
  GetCampaignsListAPIResponse,
  Campaigns
} from '../types'
import type { Payload } from '../streamConversion/generated-types'
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

  getAdAccounts = async (): Promise<DynamicFieldResponse> => {
    try {
      const response: Array<Accounts> = []
      const result = await this.request<GetAdAccountsAPIResponse>(`${BASE_URL}/adAccountUsers`, {
        method: 'GET',
        searchParams: {
          q: 'authenticatedUser'
        }
      })

      result.data.elements.forEach((item) => {
        response.push(item)
      })

      const choices = response?.map((item) => {
        return {
          label: item.role,
          value: item.account
        }
      })

      return {
        choices: choices
      }
    } catch (err) {
      return {
        choices: [],
        error: {
          message:
            (err as AccountsErrorInfo).response?.data?.message ?? 'An error occurred while fetching ad accounts.',
          code: (err as AccountsErrorInfo).response?.data?.code?.toString() ?? 'FETCH_AD_ACCOUNTS_ERROR'
        }
      }
    }
  }

  getConversionRulesList = async (adAccountId: string): Promise<DynamicFieldResponse> => {
    if (!adAccountId || !adAccountId.length) {
      return {
        choices: [],
        error: {
          message: 'Please select Ad Account first to get list of Conversion Rules.',
          code: 'FIELD_NOT_SELECTED'
        }
      }
    }

    try {
      const response: Array<Conversions> = []
      const result = await this.request<GetConversionListAPIResponse>(`${BASE_URL}/conversions`, {
        method: 'GET',
        searchParams: {
          q: 'account',
          account: adAccountId
        }
      })

      result.data.elements.forEach((item) => {
        response.push(item)
      })

      const choices = response?.map((item) => {
        return {
          label: item.name,
          value: item.id
        }
      })

      return {
        choices: choices
      }
    } catch (err) {
      return {
        choices: [],
        error: {
          message:
            (err as AccountsErrorInfo).response?.data?.message ?? 'An error occurred while fetching conversion rules.',
          code: (err as AccountsErrorInfo).response?.data?.code?.toString() ?? 'FETCH_CONVERSIONS_ERROR'
        }
      }
    }
  }

  getCampaignsList = async (adAccountId: string): Promise<DynamicFieldResponse> => {
    if (!adAccountId || !adAccountId.length) {
      return {
        choices: [],
        error: {
          message: 'Please select Ad Account first to get list of Conversion Rules.',
          code: 'FIELD_NOT_SELECTED'
        }
      }
    }

    try {
      const response: Array<Campaigns> = []
      const result = await this.request<GetCampaignsListAPIResponse>(
        `${BASE_URL}/adAccounts/${adAccountId}/adCampaigns?q=search&search=(status:(values:List(ACTIVE)))`,
        {
          method: 'GET',
          headers: {
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      )

      result.data.elements.forEach((item) => {
        response.push(item)
      })

      const choices = response?.map((item) => {
        return {
          label: item.name,
          value: item.id
        }
      })

      return {
        choices: choices
      }
    } catch (err) {
      return {
        choices: [],
        error: {
          message:
            (err as AccountsErrorInfo).response?.data?.message ?? 'An error occurred while fetching conversion rules.',
          code: (err as AccountsErrorInfo).response?.data?.code?.toString() ?? 'FETCH_CONVERSIONS_ERROR'
        }
      }
    }
  }

  async streamConversionEvent(payload: Payload): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/conversionEvents`, {
      method: 'POST',
      json: {
        conversion: `urn:lla:llaPartnerConversion:${payload.conversionId}`,
        conversionHappenedAt: payload.conversionHappenedAt,
        conversionValue: payload.conversionValue,
        eventId: payload.eventId,
        user: payload.user
      }
    })
  }

  async associateCampignToConversion(payload: Payload): Promise<ModifiedResponse> {
    return this.request(
      `https://api.linkedin.com/rest/campaignConversions/(campaign:urn%3Ali%3AsponsoredCampaign%3A${payload.campaignId},conversion:urn%3Alla%3AllaPartnerConversion%3A${payload.conversionId})`,
      {
        method: 'PUT',
        headers: {
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          campaign: `urn:li:sponsoredCampaign:${payload.campaignId}`,
          conversion: `urn:lla:llaPartnerConversion:${payload.conversionId}`
        })
      }
    )
  }
}
;``
