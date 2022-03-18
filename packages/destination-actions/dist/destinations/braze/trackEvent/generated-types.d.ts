export interface Payload {
  external_id?: string
  user_alias?: {
    alias_name?: string
    alias_label?: string
  }
  braze_id?: string | null
  name: string
  time: string | number
  properties?: {
    [k: string]: unknown
  }
  _update_existing_only?: boolean
}
