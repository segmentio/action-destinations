import { createHash } from 'crypto'
import { CampaignManager360RefreshTokenResponse, CampaignManager360Settings } from './types'
import { RequestClient } from '@segment/actions-core/*'

export const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)
export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return
  }

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

export async function refreshGoogleAccessToken(request: RequestClient, settings: unknown): Promise<string> {
  const campaignManager360Settings = settings as CampaignManager360Settings
  const refreshTokenResponse = await request<CampaignManager360RefreshTokenResponse>(
    'https://www.googleapis.com/oauth2/v4/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        refresh_token: campaignManager360Settings.refreshToken,
        client_id: campaignManager360Settings.clientId,
        client_secret: campaignManager360Settings.clientSecret,
        grant_type: 'refresh_token'
      })
    }
  )

  if (!refreshTokenResponse.data.access_token) {
    throw new Error('Failed to refresh access token.')
  }

  return refreshTokenResponse.data.access_token
}
