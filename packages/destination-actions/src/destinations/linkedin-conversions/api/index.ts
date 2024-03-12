import { RequestClient, ModifiedResponse, DynamicFieldResponse, ActionHookResponse } from '@segment/actions-core'
import { BASE_URL, DEFAULT_POST_CLICK_LOOKBACK_WINDOW, DEFAULT_VIEW_THROUGH_LOOKBACK_WINDOW } from '../constants'
import type {
  ProfileAPIResponse,
  GetAdAccountsAPIResponse,
  AccountsErrorInfo,
  GetConversionListAPIResponse,
  Conversions,
  GetCampaignsListAPIResponse,
  Campaigns,
  ConversionRuleCreationResponse,
  GetConversionRuleResponse,
  ConversionRuleUpdateResponse
} from '../types'
import type { Payload, HookBundle } from '../streamConversion/generated-types'

interface ConversionRuleUpdateValues {
  name?: string
  type?: string
  attributionType?: string
  postClickAttributionWindowSize?: number
  viewThroughAttributionWindowSize?: number
}

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

  getConversionRule = async (
    adAccount: string,
    conversionRuleId: string
  ): Promise<ActionHookResponse<HookBundle['onMappingSave']['outputs']>> => {
    try {
      const { data } = await this.request<GetConversionRuleResponse>(`${BASE_URL}/conversions/${conversionRuleId}`, {
        method: 'get',
        searchParams: {
          account: adAccount
        }
      })

      return {
        successMessage: `Using existing Conversion Rule: ${conversionRuleId} `,
        savedData: {
          id: conversionRuleId,
          name: data.name || `No name returned for rule: ${conversionRuleId}`,
          conversionType: data.type || `No type returned for rule: ${conversionRuleId}`,
          attribution_type: data.attributionType || `No attribution type returned for rule: ${conversionRuleId}`,
          post_click_attribution_window_size: data.postClickAttributionWindowSize || DEFAULT_POST_CLICK_LOOKBACK_WINDOW,
          view_through_attribution_window_size:
            data.viewThroughAttributionWindowSize || DEFAULT_VIEW_THROUGH_LOOKBACK_WINDOW
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

  createConversionRule = async (
    adAccount: string,
    hookInputs: HookBundle['onMappingSave']['inputs']
  ): Promise<ActionHookResponse<HookBundle['onMappingSave']['outputs']>> => {
    if (hookInputs?.conversionRuleId) {
      return this.getConversionRule(adAccount, hookInputs?.conversionRuleId)
    }

    try {
      const { data } = await this.request<ConversionRuleCreationResponse>(`${BASE_URL}/conversions`, {
        method: 'post',
        json: {
          name: hookInputs?.name,
          account: adAccount,
          conversionMethod: 'CONVERSIONS_API',
          postClickAttributionWindowSize:
            hookInputs?.post_click_attribution_window_size || DEFAULT_POST_CLICK_LOOKBACK_WINDOW,
          viewThroughAttributionWindowSize:
            hookInputs?.view_through_attribution_window_size || DEFAULT_VIEW_THROUGH_LOOKBACK_WINDOW,
          attributionType: hookInputs?.attribution_type,
          type: hookInputs?.conversionType
        }
      })

      return {
        successMessage: `Conversion rule ${data.id} created successfully!`,
        savedData: {
          id: data.id,
          name: data.name,
          conversionType: data.type,
          attribution_type: data.attributionType || 'UNKNOWN',
          post_click_attribution_window_size: data.postClickAttributionWindowSize,
          view_through_attribution_window_size: data.viewThroughAttributionWindowSize
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

  updateConversionRule = async (
    adAccount: string,
    hookInputs: HookBundle['onMappingSave']['inputs'],
    hookOutputs: HookBundle['onMappingSave']['outputs']
  ): Promise<ActionHookResponse<HookBundle['onMappingSave']['outputs']>> => {
    if (!hookOutputs) {
      return {
        error: {
          message: `Failed to update conversion rule: No existing rule to update.`,
          code: 'CONVERSION_RULE_UPDATE_FAILURE'
        }
      }
    }

    if (hookInputs?.conversionRuleId) {
      return this.getConversionRule(adAccount, hookInputs?.conversionRuleId)
    }

    const valuesChanged = this.conversionRuleValuesUpdated(hookInputs, hookOutputs)
    if (!valuesChanged) {
      if (!hookOutputs?.id || !hookOutputs?.name || !hookOutputs?.conversionType || !hookOutputs?.attribution_type) {
        return {
          error: {
            message: `Failed to update conversion rule: Conversion rule values are not valid.`,
            code: 'CONVERSION_RULE_UPDATE_FAILURE'
          }
        }
      }

      return {
        successMessage: `No updates detected, using rule: ${hookOutputs.id}.`,
        savedData: {
          id: hookOutputs.id,
          name: hookOutputs.name,
          conversionType: hookOutputs.conversionType,
          attribution_type: hookOutputs.attribution_type,
          post_click_attribution_window_size: hookOutputs.post_click_attribution_window_size,
          view_through_attribution_window_size: hookOutputs.view_through_attribution_window_size
        }
      }
    }

    try {
      await this.request<ConversionRuleUpdateResponse>(`${BASE_URL}/conversions/${hookOutputs.id}`, {
        method: 'post',
        searchParams: {
          account: adAccount
        },
        headers: {
          'X-RestLi-Method': 'PARTIAL_UPDATE',
          'Content-Type': 'application/json'
        },
        json: {
          patch: {
            $set: valuesChanged
          }
        }
      })

      return {
        successMessage: `Conversion rule ${hookOutputs.id} updated successfully!`,
        savedData: {
          id: hookOutputs.id,
          name: valuesChanged?.name || hookOutputs.name,
          conversionType: valuesChanged?.type || hookOutputs.conversionType,
          attribution_type: valuesChanged?.attributionType || hookOutputs.attribution_type,
          post_click_attribution_window_size:
            valuesChanged?.postClickAttributionWindowSize || hookOutputs.post_click_attribution_window_size,
          view_through_attribution_window_size:
            valuesChanged?.viewThroughAttributionWindowSize || hookOutputs.view_through_attribution_window_size
        }
      }
    } catch (e) {
      return {
        savedData: {
          id: hookOutputs.id,
          name: hookOutputs.name,
          conversionType: hookOutputs.conversionType,
          attribution_type: hookOutputs.attribution_type,
          post_click_attribution_window_size: hookOutputs.post_click_attribution_window_size,
          view_through_attribution_window_size: hookOutputs.view_through_attribution_window_size
        },
        error: {
          message: `Failed to update conversion rule: ${(e as { message: string })?.message ?? JSON.stringify(e)}`,
          code: 'CONVERSION_RULE_UPDATE_FAILURE'
        }
      }
    }
  }

  getAdAccounts = async (): Promise<DynamicFieldResponse> => {
    try {
      const allAdAccountsResponse = await this.request<GetAdAccountsAPIResponse>(`${BASE_URL}/adAccounts`, {
        method: 'GET',
        searchParams: {
          q: 'search'
        }
      })

      const choices = allAdAccountsResponse.data.elements.map((item) => {
        return {
          label: item.name,
          value: `urn:li:sponsoredAccount:${item.id}`
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
        skipResponseCloning: true,
        searchParams: {
          q: 'account',
          account: adAccountId,
          start: 0,
          count: 100
        }
      })

      result.data.elements.forEach((item) => {
        if (item.enabled && item.conversionMethod === 'CONVERSIONS_API') {
          response.push(item)
        }
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
        `${BASE_URL}/adAccounts/${adAccountId}/adCampaigns?q=search&search=(status:(values:List(ACTIVE,DRAFT)))`,
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

  async bulkAssociateCampaignToConversion(campaignIds: string[]): Promise<ModifiedResponse> {
    if (campaignIds.length === 1) {
      return this.associateCampignToConversion(campaignIds[0])
    }

    /**
     * campaign[0]: "(campaign:urn%3Ali%3AsponsoredCampaign%3A<campaign0>,conversion:urn%3Alla%3AllaPartnerConversion%3A<this.conversionRuleId>)"
     * ...
     * campaign[n]: "(campaign:urn%3Ali%3AsponsoredCampaign%3A<campaignn>,conversion:urn%3Alla%3AllaPartnerConversion%3A<this.conversionRuleId>)"
     */
    const campaignConversions = new Map<string, string>(
      campaignIds.map((campaignId) => {
        return [
          campaignId,
          `(campaign:${encodeURIComponent(`urn:li:sponsoredCampaign:${campaignId}`)},conversion:${encodeURIComponent(
            `urn:lla:llaPartnerConversion:${this.conversionRuleId})`
          )}`
        ]
      })
    )

    /**
     * {
     *  campaignConversions.get(campaignIds[0]): {
     *    campaign: `urn:li:sponsoredCampaign:${campaignIds[0]}`,
     *    conversion: `urn:lla:llaPartnerConversion:${this.conversionRuleId}`
     *  },
     * ...
     * campaignConversions.get(campaignIds[n]): {
     *   campaign: `urn:li:sponsoredCampaign:${campaignIds[n]}`,
     *  conversion: `urn:lla:llaPartnerConversion:${this.conversionRuleId}`
     * }
     */
    const entities = Object.fromEntries(
      Array.from(campaignConversions, ([id, value]) => [
        value,
        {
          campaign: `urn:li:sponsoredCampaign:${id}`,
          conversion: `urn:lla:llaPartnerConversion:${this.conversionRuleId}`
        }
      ])
    )

    const listString = Array.from(campaignConversions, ([_, value]) => value).join(',')

    return this.request(`${BASE_URL}/campaignConversions?ids=List(${listString})`, {
      method: 'PUT',
      json: {
        entities
      }
    })
  }

  async associateCampignToConversion(campaignId: string): Promise<ModifiedResponse> {
    return this.request(
      `${BASE_URL}/campaignConversions/(campaign:urn%3Ali%3AsponsoredCampaign%3A${campaignId},conversion:urn%3Alla%3AllaPartnerConversion%3A${this.conversionRuleId})`,
      {
        method: 'PUT',
        body: JSON.stringify({
          campaign: `urn:li:sponsoredCampaign:${campaignId}`,
          conversion: `urn:lla:llaPartnerConversion:${this.conversionRuleId}`
        })
      }
    )
  }

  private conversionRuleValuesUpdated = (
    hookInputs: HookBundle['onMappingSave']['inputs'],
    hookOutputs: Partial<HookBundle['onMappingSave']['outputs']>
  ): ConversionRuleUpdateValues => {
    const valuesChanged: ConversionRuleUpdateValues = {}

    if (hookInputs?.name && hookInputs?.name !== hookOutputs?.name) {
      valuesChanged.name = hookInputs?.name
    }

    if (hookInputs?.conversionType && hookInputs?.conversionType !== hookOutputs?.conversionType) {
      valuesChanged.type = hookInputs?.conversionType
    }

    if (hookInputs?.attribution_type && hookInputs?.attribution_type !== hookOutputs?.attribution_type) {
      valuesChanged.attributionType = hookInputs?.attribution_type
    }

    if (
      hookInputs?.post_click_attribution_window_size &&
      hookInputs?.post_click_attribution_window_size !== hookOutputs?.post_click_attribution_window_size
    ) {
      valuesChanged.postClickAttributionWindowSize = hookInputs?.post_click_attribution_window_size
    }

    if (
      hookInputs?.view_through_attribution_window_size &&
      hookInputs?.view_through_attribution_window_size !== hookOutputs?.view_through_attribution_window_size
    ) {
      valuesChanged.viewThroughAttributionWindowSize = hookInputs?.view_through_attribution_window_size
    }

    return valuesChanged
  }
}
