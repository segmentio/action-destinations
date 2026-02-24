// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Amplitude project API key. You can find this key in the "General" tab of your Amplitude project.
   */
  api_key: string
  /**
   * Amplitude project secret key. You can find this key in the "General" tab of your Amplitude project.
   */
  secret_key: string
  /**
   * The Amplitude App ID for the cohort you want to sync to. You can find this in the "General" tab of your Amplitude project.
   */
  app_id: string
  /**
   * The email of the user who will own the cohorts in Amplitude. This can be overriden per Audience, but if left blank, all cohorts will be owned by this user.
   */
  owner_email: string
  /**
   * The region to send your data.
   */
  endpoint: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The email of the user who will own the cohort in Amplitude. Overrides the default Cohort Owner Email value from Settings.
   */
  owner_email?: string
  /**
   * The type of ID that will be used to sync users to the Amplitude Cohort.
   */
  id_type: string
  /**
   * The name of the cohort in Amplitude. This will override the default cohort name which is the snake_case version of the Segment Audience name.
   */
  audience_name?: string
}
