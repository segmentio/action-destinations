// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Use this section to Map simple Key-Value pairs from the Event
   */
  key_value_pairs?: {
    [k: string]: unknown
  }
  /**
   * If the data needed is in an array, use this section to Map Array data into useable attributes
   */
  array_data?: {
    [k: string]: unknown
  }[]
  /**
   * If the data is present in a Context section, use this to map the attributes of a Context Section
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * If the data is present in a Properties section, use this to map the attributes of a Properties Section
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * If the data is present in a Traits section, use this to map the attributes of a Traits Section
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Do Not Modify - Email is required
   */
  email: string
  /**
   * Do Not Modify - Event Type is required
   */
  type: string
  /**
   * Do Not Modify - Timestamp of the Event is required
   */
  timestamp: string | number
}
