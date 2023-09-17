// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Provide audience key. Maps to Yahoo Taxonomy segment node name
   */
  segment_audience_key: string
  /**
   * Provide audience Id (aud_...) from audience URL in Segment Engage. Maps to Yahoo Taxonomy segment node Id
   */
  segment_audience_id: string
  /**
   * Provide Engage Space Id found in Unify > Settings > API Access. Maps to Yahoo Taxonomy customer node Id and name
   */
  engage_space_id: string
  /**
   * Provide the description for Yahoo Taxonomy customer node, less then 1000 characters
   */
  customer_desc?: string
}
