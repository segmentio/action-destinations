export interface Payload {
  operation: string
  traits?: {
    [k: string]: unknown
  }
  description?: string
  customFields?: {
    [k: string]: unknown
  }
}
