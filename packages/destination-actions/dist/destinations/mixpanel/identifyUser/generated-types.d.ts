export interface Payload {
  user_id?: string | null
  anonymous_id?: string | null
  traits?: {
    [k: string]: unknown
  }
}
