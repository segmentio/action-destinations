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
   * Create an ID for your campaign. For every campaign you activate using Ambee’s pollen and/or air quality action, you need to create a new ID. Note: a campaign ID must not contain spaces. Example:“companyabc_ambeepollen” is valid while “companyabc ambeepollen” is not valid
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
   * Ambee uses the user’s IP address when determining who to send air quality and/or pollen notifications to.
   */
  ipAddress: string
}
