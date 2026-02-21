export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

export interface GoogleAPIError {
  response: {
    status: number
    data: {
      error: {
        message: string
      }
    }
  }
}
