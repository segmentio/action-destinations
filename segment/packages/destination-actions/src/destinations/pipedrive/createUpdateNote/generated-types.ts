// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID of Note in Pipedrive to Update. If left empty, a new one will be created
   */
  note_id?: number
  /**
   * ID of Lead in Pipedrive to link to. One of Lead, Person, Organization or Deal must be linked!
   */
  lead_id?: string
  /**
   * If present, used instead of field in settings to find existing person in Pipedrive.
   */
  person_match_field?: string
  /**
   * Value to find existing person by. One of Lead, Person, Organization or Deal must be linked!
   */
  person_match_value?: string
  /**
   * If present, used instead of field in settings to find existing organization in Pipedrive.
   */
  organization_match_field?: string
  /**
   * Value to find existing organization by. One of Lead, Person, Organization or Deal must be linked!
   */
  organization_match_value?: string
  /**
   * If present, used instead of field in settings to find existing deal in Pipedrive.
   */
  deal_match_field?: string
  /**
   * Value to find existing deal by. One of Lead, Person, Organization or Deal must be linked!
   */
  deal_match_value?: string
  /**
   * Content of the note in text or HTML format. Subject to sanitization on the back-end.
   */
  content: string
}
