// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An identifier for the Floodlight activity group associated with this activity, which appears as a parameter in your tags. This value is case sensitive.
   */
  activityGroupTagString: string
  /**
   * An identifier for your Floodlight activity, which appears as a parameter in your tags. This value is case sensitive.
   */
  activityTagString: string
  /**
   * In Campaign Manager, go to Floodlight -> Configuration, under Tags, if **Dynamic** is selected, select **True**
   */
  enableDynamicTags?: boolean
  /**
   * Specifies how conversions will be counted for this Floodlight activity.
   */
  countingMethod: string
  /**
   * Use this field to insert a unique session ID if you’re using counter tags with a per session counting methodology. The session ID tells Campaign Manager 360 to count only one event per session on your site.
   */
  sessionId?: string
  /**
   * Custom Floodlight variables enable you to capture information beyond the basics (visits and revenue) that you can collect with standard parameters in your tags.
   */
  uVariables?: {
    [k: string]: unknown
  }
  /**
   * You can insert custom data into event snippets with the dc_custom_params field. This field accepts any values you want to pass to Google Marketing Platform.
   */
  dcCustomParams?: {
    [k: string]: unknown
  }
}
