// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Provide audience key. This maps to the "Name" of the Segment node in Yahoo taxonomy
   */
  segment_audience_key: string
  /**
   * Provide audience Id (aud_...) from audience URL in Segment Engage. This maps to the "Id" of the Segment node in Yahoo taxonomy
   */
  segment_audience_id: string
  /**
   * Provide Engage Space Id found in Unify > Settings > API Access. This maps to the "Id" and "Name" of the top-level Customer node in Yahoo taxonomy and specifies the parent node for your Segment node in Yahoo taxonomy
   */
  engage_space_id?: string
  /**
   * Provide the description for Segment node in Yahoo taxonomy. This must be less then 1000 characters
   */
  customer_desc?: string
}
