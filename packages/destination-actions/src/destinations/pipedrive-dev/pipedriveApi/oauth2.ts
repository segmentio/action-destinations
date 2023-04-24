export interface RefreshTokenResponse {
  access_token: string
  token_type: 'bearer'
  refresh_token: string
  scope: string
  expires_in: number
  api_domain: string
}
