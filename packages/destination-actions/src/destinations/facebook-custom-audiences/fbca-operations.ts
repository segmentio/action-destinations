import { RequestClient } from '@segment/actions-core'

const FACEBOOK_API_VERSION = 'v20.0'

interface AudienceCreationResponse {
  id: string
  message: string
}

export default class FacebookClient {
  request: RequestClient
  baseUrl: string
  adAccountId: string

  constructor(request: RequestClient, adAccountId: string) {
    this.request = request
    this.baseUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/`
    this.adAccountId = adAccountId
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
}
