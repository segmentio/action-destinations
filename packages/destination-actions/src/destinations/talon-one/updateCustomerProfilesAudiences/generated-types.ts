// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An array of JSON objects that contains customer profile identifier and list of audiences to associate and dissociate with the indicated customer profile. Customer profile ID and at least one audience ID are required.
   */
  data: {
    /**
     * The customer profile integration identifier to use in Talon.One.
     */
    customerProfileId: string
    /**
     * You should get these audience IDs from Talon.One. When batching is enabled, an event can add or remove at most 5 audiences in total across Adds and Deletes. Events over this limit are rejected. Segment sends one request of up to 1000 audience changes per batch, and events beyond that are retried in a later batch. To reduce retries, keep Batch Size multiplied by the changes per event at or below 1000.
     */
    adds?: number[]
    /**
     * You should get these audience IDs from Talon.One. When batching is enabled, an event can add or remove at most 5 audiences in total across Adds and Deletes. Events over this limit are rejected. Segment sends one request of up to 1000 audience changes per batch, and events beyond that are retried in a later batch. To reduce retries, keep Batch Size multiplied by the changes per event at or below 1000.
     */
    deletes?: number[]
  }[]
  /**
   * When enabled, Segment sends events to Talon.One in batches, with many customer profiles in one request.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be smaller. Segment sends one request of up to 1000 audience changes per batch, and events beyond that are retried in a later batch, which uses up their limited retries. To reduce retries, keep this value multiplied by the changes per event at or below 1000.
   */
  batch_size?: number
}
