export interface Payload {
  note_id?: number
  lead_id?: number
  person_match_field?: string
  person_match_value?: string
  organization_match_field?: string
  organization_match_value?: string
  deal_match_field?: string
  deal_match_value?: string
  content: string
}
