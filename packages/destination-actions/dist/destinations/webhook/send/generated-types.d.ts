export interface Payload {
  url: string
  method: string
  data?: {
    [k: string]: unknown
  }
}
