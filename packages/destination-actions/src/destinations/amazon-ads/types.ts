import { HTTPError } from '@segment/actions-core'

export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

// export interface ProfileAPIResponse {
//   id: string
// }

export class AmazonTestAuthenticationError extends HTTPError {
  response: Response & {
    data: {
      message: string
    }
  }
}

export class AmazonRefreshTokenError extends HTTPError {
  response: Response & {
    data: {
      error: string
      error_description: string
    }
  }
}
