export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in?: number
  location?: string
  region?: string
  organization_uid?: string
  authorization_type?: string
  user_uid?: string
  stack_api_key?: string
}
