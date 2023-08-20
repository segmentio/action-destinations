// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Do Not Modify - Email is required
   */
  email: string
  /**
   * Do Not Modify - Event Type is required
   */
  type?: string
  /**
   * Do Not Modify - Timestamp of the Event is required
   */
  timestamp?: string | number
  /**
   * Use at least one to Map data to Acoustic
   */
  explanatory?: string
  /**
   * As an aide you can use this section to Map simple Key-Value pairs from the Event
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
   * If the data is present in a Context section, use this to pick all attributes of a Context Section
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * If the data is present in a Properties section, use this to pick all attributes in the Properties Section
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * If the data is present in a Traits section, use this to pick all attributes in the Traits Section
   */
  traits?: {
    [k: string]: unknown
  }
}
