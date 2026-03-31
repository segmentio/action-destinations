// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Required if "ID Type" is set to "User ID".
   */
  user_id?: string
  /**
   * Required if "ID Type" is set to "Amplitude ID".
   */
  amplitude_id?: string
  /**
   * Hidden field containing the Cohort ID which was returned when the Amplitude Cohort was created in the Audience Settings.
   */
  segment_external_audience_id: string
  /**
   * The maximum number of users to process in a single batch request.
   */
  batch_size: number
}
