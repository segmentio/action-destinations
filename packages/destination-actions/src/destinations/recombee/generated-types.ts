// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The ID of the Recombee Database into which the interactions will be sent.
   */
  databaseId: string
  /**
   * The private token for the Recombee Database used.
   */
  privateToken: string
  /**
   * The Recombee cluster where your Database is located. [Learn more](https://docs.recombee.com/regions)
   */
  databaseRegion: string
  /**
   * URI of the Recombee API that should be used. *Keep this field empty unless you are calling the Recombee cluster based in a specific region or you were assigned a custom URI by the Recombee Support team.*
   */
  apiUri?: string
}
