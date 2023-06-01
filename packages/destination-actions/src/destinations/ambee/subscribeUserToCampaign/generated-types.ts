// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Segment library used when the event was triggered. This Integration will only work with analytics.js or Mobile Segment libraries
   */
  segmentLibrary?: string
  /**
   * The platform of the device which generated the event e.g. "Android" or "iOS"
   */
  platform?: string
  /**
   * ...
   */
  campaignId?: string
  /**
   * The main user identifier to be sent to Ambee
   */
  userId: string
  /**
   * Subscribe to Air quality notifications from Ambee. Please select the Air Quality (AQI) risk level you would like to receive notifications for
   */
  airQualitySubscription?: string
  /**
   * Subscribe to Pollen level notifications from Ambee. Please select the Pollen risk level you would like to receive notifications for
   */
  pollenSubscription?: string
  /**
   * The IP address assocated with the user, ...
   */
  ipAddress: string
}
