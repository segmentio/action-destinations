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
   * Important! Changing this setting may block data collection to Segment if not done correctly. Select "true" to use an existing TikTok Pixel which is already installed on your website. The Pixel MUST be installed on your website when this is set to "true" or all data collection to Segment may fail.
   */
  useExistingPixel?: boolean
}
