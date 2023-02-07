import { ModifiedResponse } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'

export type SupportedMethods = 'get' | 'post'

export type QualtricsApiResponse = {
  result?: Record<string, unknown>
  meta: {
    httpStatusCode: string
    requestId: string
  }
}

export type QualtricsApiErrorResponse = {
  meta: {
    httpStatusCode: string
    requestId: string
    error?: {
      errorMessage: string
      errorCode: string
    }
  }
}

export type WhoAmiResponse = {
  brandId: string
  userId: string
  userName: string
  accountType: string
  firstName: string
  lastName: string
  email: string
  datacenter: string
}

export type Directory = {
  directoryId: string
  name: string
  contactCount: number
  isDefault: boolean
  deduplicationCriteria: {
    email: boolean
    firstName: boolean
    lastName: boolean
    externalDataReference: boolean
    phone: boolean
  }
}

export type ListDirectoriesResponse = {
  elements: Directory[]
}

export type CreateDirectoryContactRequest = {
  firstName: string | undefined
  lastName: string | undefined
  email: string | undefined
  phone: string | undefined
  extRef: string | undefined
  embeddedData: { [k: string]: unknown } | undefined
  language: string | undefined
  unsubscribed: boolean | undefined
}

export type CreateDirectoryContactResponse = {
  id: string
}

type StandardRequestParams = {
  headers: Record<string, string>
  method: SupportedMethods
}

export default class QualtricsApiClient {
  private baseUrl: string
  private apiToken: string
  private request: RequestClient

  constructor(dc: string, apiToken: string, request: RequestClient) {
    this.baseUrl = `https://${dc || 'iad1'}.qualtrics.com`
    this.apiToken = apiToken
    this.request = request
  }

  public async whoaAmI(): Promise<WhoAmiResponse> {
    const endpoint = `/API/v3/whoami`
    return ((await this.makeRequest(endpoint, 'get')).json() as unknown as QualtricsApiResponse)
      .result as WhoAmiResponse
  }

  public async createDirectoryContact(
    directoryId: string,
    body: CreateDirectoryContactRequest
  ): Promise<ModifiedResponse> {
    const endpoint = `/API/v3/directories/${directoryId}/contacts`
    return await this.makeRequest(endpoint, 'post', body)
  }

  private async makeRequest(
    endpoint: string,
    method: SupportedMethods,
    body?: Record<string, any> | undefined
  ): Promise<ModifiedResponse> {
    return await this.request(this.buildUrl(endpoint), {
      ...this.buildRequestParams(method),
      json: body
    })
  }

  private buildUrl(endpoint: string): string {
    let parsedEndpoint = endpoint
    if (parsedEndpoint.startsWith('/')) {
      parsedEndpoint = parsedEndpoint.substring(1)
    }
    return `${this.baseUrl}/${parsedEndpoint}`
  }

  private buildRequestParams(method: SupportedMethods): StandardRequestParams {
    return {
      method,
      headers: {
        'Content-type': 'application/json',
        'X-API-TOKEN': this.apiToken
      }
    }
  }
}
