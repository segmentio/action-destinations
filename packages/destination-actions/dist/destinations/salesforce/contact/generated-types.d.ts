export interface Payload {
  operation: string
  traits?: {
    [k: string]: unknown
  }
  last_name?: string
  first_name?: string
  account_id?: string
  email?: string
  mailing_city?: string
  mailing_postal_code?: string
  mailing_country?: string
  mailing_street?: string
  mailing_state?: string
  customFields?: {
    [k: string]: unknown
  }
}
