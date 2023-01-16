// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The external_id serves as a unique user identifier for whom you are submitting data. This identifier should be the same as the one you set in the Braze SDK in order to avoid creating multiple profiles for the same user.
   */
  external_id?: string
  /**
   * A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).
   */
  user_alias?: {
    alias_name: string
    alias_label: string
  }
  /**
   * The unique device Identifier
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
   * Properties of the event
   */
  event_properties: {
    [k: string]: unknown
  }
  /**
   * When the event occurred.
   */
  time: string
}
