import { HTTPError } from '@segment/actions-core'

export class PinterestConversionsTestAuthenticationError extends HTTPError {
  response: Response & {
    data: {
      message: string
    }
  }
}
