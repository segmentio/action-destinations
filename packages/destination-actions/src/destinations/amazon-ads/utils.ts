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

// export const AUTHORIZATION_URL: any = {
//   'https://advertising-api.amazon.com': 'https://api.amazon.com/auth/o2/token',
//   'https://advertising-api-eu.amazon.com': 'https://api.amazon.co.uk/auth/o2/token',
//   'https://advertising-api-fe.amazon.com': 'https://api.amazon.co.jp/auth/o2/token'
// }
