export interface CampaignManager360RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

export interface CampaignManager360ConversionsBatchInsertRequest {
  conversions: CampaignManager360Conversion[]
  kind: 'dfareporting#conversionsBatchInsertRequest'
}

export interface CampaignManager360Conversion {
  customVariables?: CampaignManager360ConversionCustomVariable[]
  dclid?: string
  gclid?: string
  floodlightActivityId: string
  floodlightConfigurationId: string
  ordinal?: number
  quantity?: number
  timestampMicros?: number
  value?: number
}

export interface CampaignManager360ConversionCustomVariable {
  key: string
  value: string
}

export interface CampaignManager360Settings {
  clientId: string
  clientSecret: string
  refreshToken: string
}
