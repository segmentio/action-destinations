import { HTTPError } from '@segment/actions-core'

export class AmazonAdsError extends HTTPError {
  response: Response & {
    data: string
  }
}
