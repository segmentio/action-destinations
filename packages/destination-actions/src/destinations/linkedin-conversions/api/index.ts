import type { RequestClient, ModifiedResponse, DynamicFieldResponse, ActionHookResponse } from '@segment/actions-core'
import { BASE_URL } from '../constants'
import type {
  ProfileAPIResponse,
  GetAdAccountsAPIResponse,
  Accounts,
  AccountsErrorInfo,
  GetConversionListAPIResponse,
  Conversions,
  GetCampaignsListAPIResponse,
  Campaigns,
  ConversionRuleCreationResponse,
  GetConversionRuleResponse
} from '../types'
import type { Payload, HookBundle } from '../streamConversion/generated-types'
export class LinkedInConversions {
  request: RequestClient
  conversionRuleId?: string

  constructor(request: RequestClient, conversionRuleId?: string) {
    this.request = request
    this.conversionRuleId = conversionRuleId
  }

  async getProfile(): Promise<ModifiedResponse<ProfileAPIResponse>> {
    return this.request(`${BASE_URL}/me`, {
      method: 'GET'
    })
  }

  createConversionRule = async (
    payload: Payload,
    hookInputs: HookBundle['onMappingSave']['inputs']
  ): Promise<ActionHookResponse<HookBundle['onMappingSave']['outputs']>> => {
    if (hookInputs?.conversionRuleId) {
      try {
        const { data } = await this.request<GetConversionRuleResponse>(
          `${BASE_URL}/conversions/${this.conversionRuleId}`,
          {
            method: 'get',
            searchParams: {
              account: payload?.adAccountId
            }
          }
        )

        return {
          successMessage: `Using existing Conversion Rule: ${hookInputs.conversionRuleId} `,
          savedData: {
            id: hookInputs.conversionRuleId,
            name: data.name || `No name returned for rule: ${hookInputs.conversionRuleId}`,
            conversionType: data.type || `No type returned for rule: ${hookInputs.conversionRuleId}`
          }
        }
      } catch (e) {
        return {
          error: {
            message: `Failed to verify conversion rule: ${(e as { message: string })?.message ?? JSON.stringify(e)}`,
            code: 'CONVERSION_RULE_VERIFICATION_FAILURE'
          }
        }
      }
    }

    try {
      const { data } = await this.request<ConversionRuleCreationResponse>(`${BASE_URL}/conversions`, {
        method: 'post',
        json: {
          name: hookInputs?.name,
          account: payload?.adAccountId,
          conversionMethod: 'CONVERSIONS_API',
          postClickAttributionWindowSize: 30,
          viewThroughAttributionWindowSize: 7,
          attributionType: hookInputs?.attribution_type,
          type: hookInputs?.conversionType
        }
      })

      return {
        successMessage: `Conversion rule ${data.id} created successfully!`,
        savedData: {
          id: data.id,
          name: data.name,
          conversionType: data.type
        }
      }
    } catch (e) {
      return {
        error: {
          message: `Failed to create conversion rule: ${(e as { message: string })?.message ?? JSON.stringify(e)}`,
          code: 'CONVERSION_RULE_CREATION_FAILURE'
        }
      }
    }
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
          label: item.user,
          value: item.account
        }
      })

      return {
        choices
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
        choices
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

  getCampaignsList = async (adAccountUrn: string): Promise<DynamicFieldResponse> => {
    const parts = adAccountUrn.split(':')
    const adAccountId = parts.pop()

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
          method: 'GET'
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
        choices
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

  async streamConversionEvent(payload: Payload, conversionTime: number): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/conversionEvents`, {
      method: 'POST',
      json: {
        conversion: `urn:lla:llaPartnerConversion:${this.conversionRuleId}`,
        conversionHappenedAt: conversionTime,
        conversionValue: payload.conversionValue,
        eventId: payload.eventId,
        user: {
          userIds: payload.userIds,
          userInfo: payload.userInfo
        }
      }
    })
  }

  async associateCampignToConversion(payload: Payload): Promise<ModifiedResponse> {
    return this.request(
      `${BASE_URL}/campaignConversions/(campaign:urn%3Ali%3AsponsoredCampaign%3A${payload.campaignId},conversion:urn%3Alla%3AllaPartnerConversion%3A${this.conversionRuleId})`,
      {
        method: 'PUT',
        body: JSON.stringify({
          campaign: `urn:li:sponsoredCampaign:${payload.campaignId}`,
          conversion: `urn:lla:llaPartnerConversion:${this.conversionRuleId}`
        })
      }
    )
  }
}
