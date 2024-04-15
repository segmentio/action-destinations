// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your TikTok Pixel ID. Please see TikTok's [Pixel documentation](https://ads.tiktok.com/marketing_api/docs?id=1739583652957185) for information on how to find this value.
   */
  pixelCode: string
  /**
   * In order to help facilitate advertiser's compliance with the right to opt-out of sale and sharing of personal data under certain U.S. state privacy laws, TikTok offers a Limited Data Use ("LDU") feature. For more information, please refer to TikTok's [documentation page](https://business-api.tiktok.com/portal/docs?id=1770092377990145).
   */
  ldu?: boolean
  /**
   * Deprecated. Please do not provide any value.
   */
  useExistingPixel?: boolean
}
