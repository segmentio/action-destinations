export interface Payload {
  operation: string
  traits?: {
    [k: string]: unknown
  }
  company?: string
  last_name?: string
  first_name?: string
  email?: string
  city?: string
  postal_code?: string
  country?: string
  street?: string
  state?: string
  customFields?: {
    [k: string]: unknown
  }
}
