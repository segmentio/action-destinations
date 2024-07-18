import { DynamicFieldItem, DynamicFieldError, RequestClient } from '@segment/actions-core'

const FACEBOOK_API_VERSION = 'v20.0'

interface AudienceCreationResponse {
  id: string
  message: string
}

interface GetAllAudienceResponse {
  data: {
    id: string
    name: string
  }[]
}

interface GetSingleAudienceResponse {
  name: string
  id: string
}

interface FacebookResponseError {
  error: {
    message: string
    type: string
    code: number
  }
}

export default class FacebookClient {
  request: RequestClient
  baseUrl: string
  adAccountId: string

  constructor(request: RequestClient, adAccountId: string) {
    this.request = request
    this.baseUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/`
    this.adAccountId = this.formatAdAccount(adAccountId)
  }

  createAudience = async (name: string) => {
    return this.request<AudienceCreationResponse>(`${this.baseUrl}${this.adAccountId}/customaudiences`, {
      method: 'post',
      json: {
        name,
        subtype: 'CUSTOM',
        customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
      }
    })
  }

  getSingleAudience = async (
    audienceId: string
  ): Promise<{ data?: GetSingleAudienceResponse; error?: FacebookResponseError }> => {
    try {
      const fields = '?fields=id,name'
      const { data } = await this.request<GetSingleAudienceResponse>(`${this.baseUrl}${audienceId}${fields}`)
      return { data, error: undefined }
    } catch (error) {
      return { data: undefined, error: error as FacebookResponseError }
    }
  }

  getAllAudiences = async (): Promise<{ choices: DynamicFieldItem[]; error: DynamicFieldError | undefined }> => {
    const { data } = await this.request<GetAllAudienceResponse>(
      `${this.baseUrl}${this.adAccountId}/customaudiences?fields=id,name&limit=200`
    )

    const choices = data.data.map(({ id, name }) => ({
      value: id,
      label: name
    }))

    return {
      choices,
      error: undefined
    }
  }

  private formatAdAccount(adAccountId: string) {
    if (adAccountId.startsWith('act_')) {
      return adAccountId
    }
    return `act_${adAccountId}`
  }
}
