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
  countryCode?: string
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
