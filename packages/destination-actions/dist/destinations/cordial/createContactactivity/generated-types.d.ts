export interface Payload {
  identifyByKey: string
  identifyByValue: string
  action: string
  time?: string | number
  properties?: {
    [k: string]: unknown
  }
}
