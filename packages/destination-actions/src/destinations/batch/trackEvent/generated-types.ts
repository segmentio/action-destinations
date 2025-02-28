// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifiant(s) de l'utilisateur
   */
  identifiers?: {
    /**
     * The unique profile identifier
     */
    custom_id: string
  }
  /**
   * Profile event
   */
  events?: {
    /**
     * The event's name
     */
    name: string
    /**
     * An object containing all event's attributes
     */
    attributes?: {
      [k: string]: unknown
    } | null
    /**
     * Maximum number of attributes to include in an event.
     */
    event_attributes_batch_size?: number
  }[]
}
