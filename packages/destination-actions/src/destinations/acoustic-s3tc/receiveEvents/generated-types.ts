// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Map simple Key-Value pairs (optional)
   */
  key_value_pairs?: {
    [k: string]: unknown
  }
  /**
   * If the data needed is in an array, use this section to Map Array data into useable attributes (optional)
   */
  array_data?: {
    [k: string]: unknown
  }[]
  /**
   * If the data is present in a Context section, use this to map the attributes of a Context Section (optional)
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * If the data is present in a Properties section, use this to map the attributes of a Properties Section (optional)
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * If the data is present in a Traits section, use this to map the attributes of a Traits Section (optional)
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Do Not Modify - Email is required
   */
  email: string
  /**
   * Do Not Modify - The type of event. e.g. track or identify, this field is required
   */
  type: string
  /**
   * Do Not Modify - The timestamp for when the event took place. This field is required
   */
  timestamp: string | number
}
