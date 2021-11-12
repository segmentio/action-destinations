// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If present, used instead of field in settings to find existing person in Pipedrive.
   */
  person_match_field?: string
  /**
   * Value to find existing person by
   */
  person_match_value: string
  /**
   * If present, used instead of field in settings to find existing organization in Pipedrive.
   */
  organization_match_field?: string
  /**
   * Value to find existing organization by
   */
  organization_match_value: string
  /**
   * If present, used instead of field in settings to find existing deal in Pipedrive.
   */
  deal_match_field?: string
  /**
   * Value to find existing deal by
   */
  deal_match_value: string
  /**
   * Content of the note in HTML format. Subject to sanitization on the back-end.
   */
  content: string
}
