// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The asset's unique identifier. Please make sure to map only the fields where values don't include space character
   */
  asset_uri: string
  /**
   * User friendly description of the asset in the UI
   */
  ope_title?: string
  /**
   * Textual content of the asset processing using NLP alogrithms
   */
  ope_content?: string
  /**
   * Custom fields to include with the event
   */
  custom_fields?: {
    [k: string]: unknown
  }
}
