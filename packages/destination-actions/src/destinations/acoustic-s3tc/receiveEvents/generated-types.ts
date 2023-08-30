// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * (optional) Map simple Key-Value pairs
   */
  key_value_pairs?: {
    [k: string]: unknown
  }
  /**
   * (optional) If the data needed is in an array, use this section to Map Array data into useable attributes
   */
  array_data?: {
    [k: string]: unknown
  }[]
  /**
   * (optional) If the data is present in a Context section, use this to map the attributes of a Context Section
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * (optional) If the data is present in a Properties section, use this to map the attributes of a Properties Section
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * (optional) If the data is present in a Traits section, use this to map the attributes of a Traits Section
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Do Not Modify - Email is required
   */
  email: string
  /**
   * The type of event. e.g. track or identify. This field is required
   */
  type: string
  /**
   * The timestamp for when the event took place. This field is required
   */
  timestamp: string | number
}
