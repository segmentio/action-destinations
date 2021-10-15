// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * TikTok Long Term Access Token. You can generate this from the TikTok Marketing API portal. Please follow TikTok's [Authorization guide](https://ads.tiktok.com/athena/docs/index.html?plat_id=-1&doc_id=100010&id=100681&key=e98b971a296ae45d8e35a22fba032d1c06f5973de9aab73ce07b82f230cf3afd) for more info.
   */
  accessToken: string
  /**
   * TikTok App Secret Key. You can find this key in the "Basic Information" tab of your TikTok app.
   */
  secretKey: string
  /**
   * TikTok App Id. You can find this key in the "Basic Information" tab of your TikTok app.
   */
  appId: string
  /**
   * An ID for your pixel. Required to send events to the TikTok pixel.
   */
  pixel_code: string
}
