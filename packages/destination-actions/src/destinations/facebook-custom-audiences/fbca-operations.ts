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
  paging: {
    cursors: {
      before: string
      after: string
    }
    next: string
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
        description: 'TODO: Hardcoded for now',
        customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED' //required to create an audience
      }
    })
  }

  getAllAudiences = async (): Promise<[DynamicFieldItem[], DynamicFieldError | undefined]> => {
    const { data } = await this.request<GetAllAudienceResponse>(
      `${this.baseUrl}${this.adAccountId}/customaudiences?fields=id,name`
    )

    // console.log('data.paging', data.paging)
    const choices = data.data.map(({ id, name }) => ({
      value: id,
      label: name
    }))

    return [choices, undefined]
  }

  private formatAdAccount(adAccountId: string) {
    if (adAccountId.startsWith('act_')) {
      return adAccountId
    }
    return `act_${adAccountId}`
  }
}
