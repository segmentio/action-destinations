// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the player in your database.
   */
  playerUniqueId: string
  /**
   * Player's unique mobile number.
   */
  mobile?: string
  /**
   * Player's unique email.
   */
  email?: string
  /**
   * Player's display name
   */
  displayName?: string
  /**
   * Player's first name
   */
  firstName?: string
  /**
   * Player's last name
   */
  lastName?: string
  /**
   * Player's gender.
   */
  gender?: string
  /**
   * Player's date of birth
   */
  dateOfBirth?: string | number
  /**
   * Player's join date at your system.
   */
  joinDate?: string | number
  /**
   * Player's country.
   */
  country?: string
  /**
   * Player's city
   */
  city?: string
  /**
   * Player's zip code
   */
  zip?: string
  /**
   * Player's preferred language
   */
  preferredLanguage?: string
  /**
   * A boolean value indicating if the customer who placed this order is a guest. The default is false.
   */
  guest?: boolean
  /**
   * Player's utms
   */
  utms?: {
    /**
     * UTM campaign name
     */
    campaign?: string
    /**
     * UTM campaign source
     */
    source?: string
    /**
     * UTM campaign medium
     */
    medium?: string
    /**
     * UTM campaign content
     */
    content?: string
    /**
     * UTM campaign term
     */
    term?: string
  }[]
  /**
   * Player's used devices
   */
  devices?: {
    /**
     * User agent
     */
    userAgent?: string
    /**
     * Player operating system
     */
    os?: string
    /**
     * Player used device
     */
    device?: string
  }[]
  /**
   * Player's total spent amount
   */
  totalSpent?: number
  /**
   * Player's last order date
   */
  lastOrderDate?: string | number
  /**
   * Player's total orders
   */
  totalOrders?: number
  /**
   * Player's average order amount
   */
  avgOrderAmount?: number
  /**
   * Comma separated string of tags to be attached to the player.
   */
  tags?: string
  /**
   * Key value pairs of any extra player attributes.
   */
  playerCustomAttributes?: {
    [k: string]: unknown
  }
  /**
   * Referring player’s referral code. This is used in case of referral, where the player to be created is referred by the player having this code.
   */
  referrerCode?: string
  /**
   * The level order to place the player in. IMPORTANT: manual player leveling is available under special circumstances and is not available by default. Contact us for more info.
   */
  levelOrder?: number
  /**
   * The FCM token (Firebase Cloud Messaging) needed for sending mobile push notifications. (Used only in case of mobile app)
   */
  deviceToken?: string
}
