// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your MNTN Advertiser ID, provided when you register as an MNTN advertiser. Contact your MNTN account manager if you need help locating this.
   */
  advertiser_id: string
  /**
   * Your MNTN Audience API key, issued via the MNTN Integrations Marketplace. Treat this value as a secret — do not share it or commit it to source control.
   */
  api_key: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The ID of a pre-existing MNTN audience segment to sync to. If left blank, a new MNTN segment will be created automatically when this destination is enabled for an audience.
   */
  segment_id?: string
}
