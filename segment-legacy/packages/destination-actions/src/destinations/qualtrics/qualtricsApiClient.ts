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

export type CreateContactTransactionRequest = Record<
  string,
  {
    contactId: string
    mailingListId: string
    transactionDate: string // YYYY-MM-DD HH:MM:SS
    data?: Record<string, string | number | boolean>
  }
>

export type CreateContactTransactionResponse = {
  createdTransactions: Record<
    string,
    {
      id: string
    }
  >
  unprocessedTransactions: Record<
    string,
    {
      error: string
      errorMessage: string
    }
  >
}

export type SearchDirectoryForContactRequest = {
  email?: string
  extRef?: string
  phone?: string
}

export type SearchDirectoryContactResponse = {
  id: string
  creationDate: string
  lastModified: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  externalDataReference: string
  language: string
  unsubscribed: boolean
  unsubscribeDate: string
  stats: Record<string, string>
  embeddedData: Record<string, string>
  segmentMembership: Record<string, any>
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
    return (await this.makeRequest(endpoint, 'get')).result as WhoAmiResponse
  }

  public async listDirectories(): Promise<ListDirectoriesResponse> {
    const endpoint = `/API/v3/directories/`
    return (await this.makeRequest(endpoint, 'get')).result as ListDirectoriesResponse
  }

  public async createDirectoryContact(
    directoryId: string,
    body: CreateDirectoryContactRequest
  ): Promise<CreateDirectoryContactResponse> {
    const endpoint = `/API/v3/directories/${directoryId}/contacts`
    return (await this.makeRequest(endpoint, 'post', body)).result as CreateDirectoryContactResponse
  }

  public async createContactTransaction(
    directoryId: string,
    body: CreateContactTransactionRequest
  ): Promise<CreateContactTransactionResponse> {
    const endpoint = `/API/v3/directories/${directoryId}/transactions`
    return (await this.makeRequest(endpoint, 'post', body)).result as CreateContactTransactionResponse
  }

  public async searchDirectoryForContact(
    directoryId: string,
    body: SearchDirectoryForContactRequest
  ): Promise<SearchDirectoryContactResponse[]> {
    const endpoint = `/API/v3/directories/${directoryId}/contacts/search`
    const filterBody = this.createFilterBody(body)
    if (!filterBody) {
      return []
    }
    return (await this.makeRequest(endpoint, 'post', filterBody)).result?.elements as SearchDirectoryContactResponse[]
  }

  private async makeRequest(
    endpoint: string,
    method: SupportedMethods,
    body?: Record<string, any> | undefined
  ): Promise<QualtricsApiResponse> {
    const response = await this.request(this.buildUrl(endpoint), {
      ...this.buildRequestParams(method),
      json: body
    })
    return response.data as QualtricsApiResponse
  }

  private createFilterBody(body: SearchDirectoryForContactRequest) {
    const filterArray: { filterType: string; comparison: string; value: string }[] = []
    const bodyKeys = Object.keys(body)
    ;['extRef', 'phone', 'email'].forEach((key: string) => {
      if (bodyKeys.includes(key) && body[key as keyof SearchDirectoryForContactRequest] !== undefined) {
        filterArray.push({
          filterType: key,
          comparison: 'eq',
          value: body[key as keyof SearchDirectoryForContactRequest] as string
        })
      }
    })
    if (filterArray.length === 1) {
      return {
        filter: filterArray[0]
      }
    } else if (filterArray.length > 1) {
      return {
        filter: {
          conjunction: 'and',
          filters: filterArray
        }
      }
    }
    return
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
        'X-API-TOKEN': this.apiToken,
        'Internal-Team': 'integrations',
        'Internal-Service': 'segment-destination'
      }
    }
  }
}
