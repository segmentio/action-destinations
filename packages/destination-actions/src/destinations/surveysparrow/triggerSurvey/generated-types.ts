// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Channel ID is the unique identifier for the Share Channel in SurveySparrow. This can be copied from the URL.
   */
  id: number
  /**
   * Type of Survey Share to be triggered
   */
  share_type: string
  /**
   * Select the SurveySparrow Survey you want to trigger
   */
  survey_id: number
  /**
   * Mobile number to send Survey to for either SMS or WhatsApp. This should include + followed by Country Code. For Example, +18004810410. Mobile is required for SMS or WhatsApp Shares
   */
  mobile?: string
  /**
   * Email address to send Survey to. This is required for an Email Share.
   */
  email?: string
  /**
   * Variables you want to pass to SurveySparrow.
   */
  variables?: {
    [k: string]: unknown
  }
}
