// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event to track in Mixpanel.
   */
  event_name?: string
  /**
   * Properties to associate with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The unique ID to associate with the user. Settings this value will trigger a Mixpanel identify call before immediately the page event is sent.
   */
  unique_id: string
  /**
   * User Profile Properties to set on the user profile in Mixpanel.
   */
  user_profile_properties_to_set?: {
    /**
     * The name of the user.
     */
    name?: string
    /**
     * The first name of the user.
     */
    first_name?: string
    /**
     * The last name of the user.
     */
    last_name?: string
    /**
     * The email of the user.
     */
    email?: string
    /**
     * The phone number of the user.
     */
    phone?: string
    /**
     * The avatar URL of the user.
     */
    avatar?: string
    /**
     * The creation date of the user profile.
     */
    created?: string
    [k: string]: unknown
  }
  /**
   * User Profile Properties to set once on the user profile in Mixpanel. Values which get set once cannot be overwritten later.
   */
  user_profile_properties_to_set_once?: {
    [k: string]: unknown
  }
  /**
   * User Profile Properties to increment on the user profile in Mixpanel. Values must be numeric.
   */
  user_profile_properties_to_increment?: {
    [k: string]: unknown
  }
  /**
   * Details for the group to be created or updated in Mixpanel. Setting this value will trigger a Mixpanel set_group call before the page event is sent.
   */
  group_details?: {
    /**
     * The Group Key / type of group to associate with the user. This group key should already be defined in your Mixpanel project.
     */
    group_key: string
    /**
     * The unique ID to associate with the group.
     */
    group_id: string
  }
  /**
   * Group Profile Properties to set on the group in Mixpanel.
   */
  group_profile_properties_to_set?: {
    [k: string]: unknown
  }
  /**
   * Group Profile Properties to set once on the group profile in Mixpanel. Values which get set once cannot be overwritten later.
   */
  group_profile_properties_to_set_once?: {
    [k: string]: unknown
  }
  /**
   * Merge a list into a list group property. Duplicates will be removed.
   */
  group_profile_properties_to_union?: {
    /**
     * The name of the list property to union values into.
     */
    list_name: string
    /**
     * An array of string values to merge into the list. Non string lists cannot be updated. Duplicates will be removed.
     */
    string_values: string[]
  }[]
}
