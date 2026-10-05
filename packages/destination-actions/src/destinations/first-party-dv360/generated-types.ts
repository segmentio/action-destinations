// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Whether Segment creates a new audience in Display & Video 360 or connects to an existing one. The "connect to an existing one with the same name" option only connects if exactly one audience with that name exists and its settings match. [Learn more](https://www.twilio.com/docs/segment/connections/destinations/catalog/actions-first-party-dv360#create-or-connect-audience).
   */
  operation?: string
  /**
   * The ID of your Display & Video 360 advertiser. **Required:** always.
   */
  advertiserId: string
  /**
   * The type of the audience. **Required:** always. When connecting to an existing audience, it must match that audience's type.
   */
  audienceType: string
  /**
   * The ID of an audience which already exists in Display & Video 360. **Required:** when Create or Connect Audience is "Connect to existing audience". **Not required:** for the other Create or Connect Audience options, which ignore this ID.
   */
  existingAudienceId?: string
  /**
   * The name of the audience in Display & Video 360. **Optional:** when creating a new audience; defaults to the Segment audience name. Must be unique per advertiser; see Create or Connect Audience for what happens if it already exists. **Not required:** when connecting to an existing audience (ignored).
   */
  audienceDisplayName?: string
  /**
   * The description of the audience. **Optional:** when creating a new audience. **Not required:** when connecting to an existing audience (ignored).
   */
  description?: string
  /**
   * The app ID matching the mobile device IDs being uploaded. **Optional:** when creating a new CUSTOMER_MATCH_DEVICE_ID audience. **Not required:** for CUSTOMER_MATCH_CONTACT_INFO audiences, or when connecting to an existing audience (ignored).
   */
  appId?: string
  /**
   * Days an entry remains in the audience, from 1 to 540. **Required:** when creating a new audience. **Not required:** when connecting to an existing audience (ignored).
   */
  membershipDurationDays?: string
}
