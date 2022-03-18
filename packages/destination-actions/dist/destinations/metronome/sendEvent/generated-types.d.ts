export interface Payload {
  transaction_id: string
  customer_id: string
  timestamp: string | number
  event_type: string
  properties: {
    [k: string]: unknown
  }
}
