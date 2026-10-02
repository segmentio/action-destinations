// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The ID of your Display & Video 360 advertiser. **Required:** always.
   */
  advertiserId: string
  /**
   * The type of the audience. **Required:** always. When connecting to an existing audience, it must match that audience's type.
   */
  audienceType: string
  /**
   * The ID of an audience which already exists in Display & Video 360. **Optional:** populate to connect to that audience instead of creating a new one. Leave blank to create a new audience.
   */
  existingAudienceId?: string
  /**
   * The name of the audience in Display & Video 360. **Optional:** when creating a new audience; defaults to the Segment audience name. Must be unique per advertiser: if an audience of the same type with this name already exists, Segment connects to it. **Not required:** when connecting to an existing audience (ignored).
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
