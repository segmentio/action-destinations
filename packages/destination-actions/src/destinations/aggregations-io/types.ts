import { HTTPError } from '@segment/actions-core'

export class AggregationsAuthError extends HTTPError {
  response: Response & {
    data: {
      message: string
    }
  }
}
