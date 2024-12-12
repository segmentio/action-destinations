export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  scope: string
  expires_in: number
  token_type: string
}
