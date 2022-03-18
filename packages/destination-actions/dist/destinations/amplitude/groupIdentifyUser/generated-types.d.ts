export interface Payload {
  user_id?: string | null
  device_id?: string
  insert_id?: string
  time?: string
  group_properties?: {
    [k: string]: unknown
  }
  group_type: string
  group_value: string
  min_id_length?: number | null
}
