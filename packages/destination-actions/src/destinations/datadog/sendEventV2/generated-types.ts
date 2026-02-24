// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event title displayed in Datadog Event Management (1–500 characters).
   */
  title: string
  /**
   * The category of the event. Use "alert" for monitoring and alerting events. Use "change" for configuration changes, deployments, or feature flag updates.
   */
  category: string
  /**
   * Free-form text body for the event (1–4000 characters). Supports markdown.
   */
  message?: string
  /**
   * An arbitrary key used to correlate related events in Datadog (1–100 characters). Events with the same aggregation key are grouped together.
   */
  aggregationKey?: string
  /**
   * Hostname to associate with the event (1–255 characters).
   */
  host?: string
  /**
   * List of tags to attach to the event in "key:value" format (e.g. "env:prod", "team:backend"). Maximum 100 tags, each up to 200 characters.
   */
  tags?: string[]
  /**
   * ISO 8601 timestamp of when the event occurred. Must be no more than 18 hours in the past. If omitted, the current time is used.
   */
  timestamp?: string | number
  /**
   * The severity status of the alert. Required when Event Category is "alert". Ignored for "change" events.
   */
  alertStatus?: string
  /**
   * Priority level for alert events (1 = highest, 5 = lowest). Only applies when Event Category is "alert".
   */
  alertPriority?: string
  /**
   * Arbitrary JSON key-value data for alert events. Maps to Datadog's attributes.custom field. Maximum 100 properties, up to 10 nesting levels.
   */
  customAttributes?: {
    [k: string]: unknown
  }
  /**
   * The name of the resource that was changed. Required when Event Category is "change".
   */
  changedResourceName?: string
  /**
   * The type of the changed resource. Required when Event Category is "change".
   */
  changedResourceType?: string
}
