export interface Payload {
  operation: string
  traits?: {
    [k: string]: unknown
  }
  close_date?: string
  name?: string
  stage_name?: string
  amount?: string
  description?: string
  customFields?: {
    [k: string]: unknown
  }
}
