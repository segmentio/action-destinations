export interface Payload {
  activity_id?: number
  person_match_field?: string
  person_match_value?: string
  organization_match_field?: string
  organization_match_value?: string
  deal_match_field?: string
  deal_match_value?: string
  subject?: string
  type?: string
  description?: string
  note?: string
  due_date?: string
  due_time?: string
  duration?: string
  done?: boolean
}
