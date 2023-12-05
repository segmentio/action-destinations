import { HTTPError } from '@segment/actions-core'

export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

export interface ProfileAPIResponse {
  id: string
}

export class LinkedInTestAuthenticationError extends HTTPError {
  response: Response & {
    data: {
      message: string
    }
  }
}

export class LinkedInRefreshTokenError extends HTTPError {
  response: Response & {
    data: {
      error: string
      error_description: string
    }
  }
}

export interface GetAdAccountsAPIResponse {
  paging: {
    count: number
    links: Array<any>
    start: number
    total: number
  }
  elements: [Accounts]
}

export interface Accounts {
  account: string
  changeAuditStamps: object
  role: string
  user: string
  version: object
}

export interface AccountsErrorInfo {
  response: {
    data: {
      message?: string
      code?: string
    }
  }
}

export interface GetConversionListAPIResponse {
  paging: {
    count: number
    links: Array<any>
    start: number
    total: number
  }
  elements: [Conversions]
}

export interface Conversions {
  name: string
  id: string
}

export interface GetCampaignsListAPIResponse {
  paging: {
    count: number
    links: Array<any>
    start: number
    total: number
  }
  elements: [Campaigns]
}

export interface Campaigns {
  name: string
  id: string
}

export interface ConversionRuleCreationResponse {
  id: string
  name: string
  type: string
}

/**
 * The shape of the response from LinkedIn when fetching a conversion rule by id.
 * Not all properties in this type are used, but they are included if needed in the future.
 */
export interface GetConversionRuleResponse {
  conversionMethod?: string
  type?: string
  enabled?: boolean
  name?: string
  id?: string
  attributionType?: string
  account?: string
}
