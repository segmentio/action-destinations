// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Revx client id which you will get it from RevX support team
   */
  client_id: string
  /**
   * Platform of the device.
   */
  os: string
  /**
   * Identifier For Advertiser (IDFA/GAID)
   */
  advertising_id?: string
  /**
   * A unique identifier for your event.
   */
  event_name?: string
  /**
   * A unique identifier for your event.
   */
  event?: string
  /**
   * A unique identifier for your request type.
   */
  type?: string
  /**
   * Identifier for Vendor. _(iOS)_
   */
  idfv?: string
  /**
   * A device-specific identifier, such as the Identifier for Vendor on iOS. Required unless user ID is present. If a device ID is not sent with the event, it will be set to a hashed version of the user ID.
   */
  device_id?: string
  /**
   * The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.
   */
  time?: string | number
  /**
   * An object of key-value pairs that represent additional data to be sent along with the event.
   */
  event_properties?: {
    [k: string]: unknown
  }
  /**
   * An object of key-value pairs that represent additional data tied to the user
   */
  user_properties?: {
    [k: string]: unknown
  }
  /**
   * The current version of your application.
   */
  app_version?: string
  /**
   * The name of the mobile operating system or browser that the user is using.
   */
  os_name?: string
  /**
   * The version of the mobile operating system or browser the user is using.
   */
  os_version?: string
  /**
   * The device brand that the user is using.
   */
  device_brand?: string
  /**
   * The device manufacturer that the user is using.
   */
  device_manufacturer?: string
  /**
   * The device model that the user is using.
   */
  device_model?: string
  /**
   * The carrier that the user is using.
   */
  carrier?: string
  /**
   * The current country of the user.
   */
  country?: string
  /**
   * The current region of the user.
   */
  region?: string
  /**
   * The current city of the user.
   */
  city?: string
  /**
   * The current Designated Market Area of the user.
   */
  dma?: string
  /**
   * The language set by the user.
   */
  language?: string
  /**
   * The price of the item purchased. Required for revenue data if the revenue field is not sent.
   */
  price?: number
  /**
   * The quantity of the item purchased. Defaults to 1 if not specified.
   */
  quantity?: number
  /**
   * Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value.
   */
  revenue?: number
  /**
   * An identifier for the item purchased. You must send a price and quantity or revenue with this field.
   */
  productId?: string
  /**
   * The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.
   */
  revenueType?: string
  /**
   * The current Latitude of the user.
   */
  location_lat?: number
  /**
   * The current Longitude of the user.
   */
  location_lng?: number
  /**
   * The IP address of the user. Use "$remote" to use the IP address on the upload request. Amplitude will use the IP address to reverse lookup a user's location (city, country, region, and DMA). Amplitude has the ability to drop the location and IP address from events once it reaches our servers. You can submit a request to Amplitude's platform specialist team here to configure this for you.
   */
  ip?: string
  /**
   * Payload data.
   */
  data?: {
    [k: string]: unknown
  }
}
