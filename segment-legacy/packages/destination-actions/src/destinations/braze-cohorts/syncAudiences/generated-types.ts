// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The external_id serves as a unique user identifier for whom you are submitting data. This identifier should be the same as the one you set in the Braze SDK in order to avoid creating multiple profiles for the same user.
   */
  external_id?: string
  /**
   * Alternate unique user identifier, this is required if External User ID or Device ID is not set. Refer [Braze Documentation](https://www.braze.com/docs/api/objects_filters/user_alias_object) for more details.
   */
  user_alias?: {
    alias_name: string
    alias_label: string
  }
  /**
   * Device IDs can be used to add and remove only anonymous users to/from a cohort. However, users with an assigned User ID cannot use Device ID to sync to a cohort.
   */
  device_id?: string
  /**
   * The Cohort Identifier
   */
  cohort_id: string
  /**
   * The name of Cohort
   */
  cohort_name: string
  /**
   * Enable batching of requests to the Braze cohorts.
   */
  enable_batching?: boolean
  /**
   * The `audience_key` of the Engage audience you want to sync to Braze Cohorts. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.
   */
  personas_audience_key: string
  /**
   * Displays properties of the event to add/remove users to a cohort and the traits of the specific user
   */
  event_properties: {
    [k: string]: unknown
  }
  /**
   * When the event occurred.
   */
  time: string
}
