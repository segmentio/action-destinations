// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Channel ID is the unique identifier for the Share Channel in SurveySparrow. This can be copied from the URL.
   */
  id: number
  /**
   * Type of survey share to be triggered
   */
  share_type: string
  /**
   * Select the SurveySparrow Survey you want to trigger
   */
  survey_id: number
  /**
   * Mobile number to trigger survey through SMS or WhatsApp. This should include + followed by Country Code. For Example, +18004810410 (Required for SMS or WhatsApp share)
   */
  mobile?: string
  /**
   * Email address to trigger survey through Email (Required for Email share)
   */
  email?: string
  /**
   * Variables you want to pass to SurveySparrow.
   */
  variables?: {
    [k: string]: unknown
  }
}
