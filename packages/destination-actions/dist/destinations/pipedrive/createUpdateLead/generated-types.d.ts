export interface Payload {
  lead_id?: number
  person_match_field?: string
  person_match_value?: string
  organization_match_field?: string
  organization_match_value?: string
  title: string
  value?: {
    amount?: number
    currency?: string
  }
  expected_close_date?: string
  visible_to?: number
  add_time?: string | number
  custom_fields?: {
    [k: string]: unknown
  }
}
