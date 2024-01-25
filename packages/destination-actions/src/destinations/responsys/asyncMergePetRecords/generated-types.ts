// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the Profile Extension Table's Contact List.
   */
  profileListName: string
  /**
   * Profile Extension Table (PET) Name
   */
  profileExtensionTable: string
  /**
   * Record data that represents Field Names and corresponding values for the recipient.
   */
  userData: {
    [k: string]: unknown
  }
  /**
   * The Map Template in Responsys that can be used to map Field Names of the Profile List to Column Names.
   */
  mapTemplateName?: string
  /**
   * Indicates what should be done for records where a match is not found.
   */
  insertOnNoMatch?: boolean
  /**
   * First match column for determining whether an insert or update should occur.
   */
  matchColumnName1?: string
  /**
   * Second match column for determining whether an insert or update should occur.
   */
  matchColumnName2?: string
  /**
   * Controls how the existing record should be updated.
   */
  updateOnMatch: string
  /**
   * Once enabled, Segment will collect events into batches of 200 before sending to Responsys.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
