import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  CampaignManager360Conversion,
  CampaignManager360ConversionsBatchInsertRequest,
  CampaignManager360RefreshTokenResponse,
  CampaignManager360Settings
} from '../types'
import { RequestClient } from '@segment/actions-core/*'

export function validateConversionPayloads(
  payloads: Payload[],
  settings: Settings
): CampaignManager360ConversionsBatchInsertRequest {
  const conversionsBatchInsertRequest: CampaignManager360ConversionsBatchInsertRequest = {
    conversions: [],
    kind: 'dfareporting#conversionsBatchInsertRequest'
  }

  for (const payload of payloads) {
    if (!payload.gclid && !payload.dclid) {
      throw new Error('Missing one of the required parameters: gclid or dclid.')
    }

    if (!payload.floodlightActivityId && !settings.defaultFloodlightActivityId) {
      throw new Error('Missing required parameter: floodlightActivityId.')
    }

    if (!payload.floodlightConfigurationId && !settings.defaultFloodlightConfigurationId) {
      throw new Error('Missing required parameter: floodlightConfigurationId.')
    }

    const conversion: CampaignManager360Conversion = {
      floodlightActivityId: String(payload.floodlightActivityId || settings.defaultFloodlightActivityId),
      floodlightConfigurationId: String(payload.floodlightConfigurationId || settings.defaultFloodlightConfigurationId)
    }

    if (payload.gclid) {
      conversion.gclid = payload.gclid
    }

    if (payload.dclid) {
      conversion.dclid = payload.dclid
    }

    if (payload.ordinal) {
      conversion.ordinal = payload.ordinal
    }

    if (payload.quantity) {
      conversion.quantity = payload.quantity
    }

    if (payload.timestampMicros) {
      conversion.timestampMicros = payload.timestampMicros
    }

    if (payload.value) {
      conversion.value = payload.value
    }

    conversionsBatchInsertRequest.conversions.push(conversion)
  }

  return conversionsBatchInsertRequest
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
