import { HTTPError } from '@segment/actions-core'

export class AmazonAdsError extends HTTPError {
  response: Response & {
    data: {
      status: string
      message: string
    }
  }
}

export interface AudiencePayload {
  name: string
  description: string
  countryCode: string
  targetResource: {
    advertiserId: string
  }
  metadata: {
    externalAudienceId: string
    ttl?: number
    audienceFees?: {
      cpmCents: number
      currency: string
    }[]
  }
}
export interface RecordsResponseType {
  jobRequestId: string
}

export const AUTHORIZATION_URL: any = {
  'https://advertising-api.amazon.com': 'https://api.amazon.com',
  'https://advertising-api-eu.amazon.com': 'https://api.amazon.co.uk',
  'https://advertising-api-fe.amazon.com': 'https://api.amazon.co.jp'
}
export const CONSTANTS = {
  CREATE: 'CREATE',
  DELETE: 'DELETE'
}
export const CURRENCY = ['USD', 'CAD', 'JPY', 'GBP', 'EUR', 'SAR', 'AUD', 'AED', 'CNY', 'MXN', 'INR', 'SEK', 'TRY']

export const REGEX_AUDIENCEID = /"audienceId":(\d+)/
export const REGEX_ADVERTISERID = /"advertiserId":"(\d+)"/

export function extractNumberAndSubstituteWithStringValue(responseString: string, regex: any, substituteWith: string) {
  const resString = responseString.replace(regex, substituteWith)
  return JSON.parse(resString)
}
