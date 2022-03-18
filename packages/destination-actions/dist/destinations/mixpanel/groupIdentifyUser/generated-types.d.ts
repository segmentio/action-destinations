export interface Payload {
  group_key?: string
  group_id: string
  traits?: {
    [k: string]: unknown
  }
}
