export interface Payload {
  deal_match_field?: string
  deal_match_value?: string
  person_match_field?: string
  person_match_value?: string
  organization_match_field?: string
  organization_match_value?: string
  title: string
  value?: string
  currency?: string
  stage_id?: number
  status?: string
  expected_close_date?: string
  probability?: number
  lost_reason?: string
  visible_to?: number
  add_time?: string | number
  custom_fields?: {
    [k: string]: unknown
  }
}
