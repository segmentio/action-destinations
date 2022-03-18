export interface Payload {
  match_field?: string
  match_value: string
  name?: string
  email?: string[]
  phone?: string[]
  visible_to?: number
  add_time?: string | number
  custom_fields?: {
    [k: string]: unknown
  }
}
