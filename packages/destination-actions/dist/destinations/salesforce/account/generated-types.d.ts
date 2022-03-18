export interface Payload {
  operation: string
  traits?: {
    [k: string]: unknown
  }
  name?: string
  account_number?: string
  number_of_employees?: number
  billing_city?: string
  billing_postal_code?: string
  billing_country?: string
  billing_street?: string
  billing_state?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_country?: string
  shipping_street?: string
  shipping_state?: string
  phone?: string
  description?: string
  website?: string
  customFields?: {
    [k: string]: unknown
  }
}
