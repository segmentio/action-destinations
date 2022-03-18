export interface Payload {
  identifyByKey: string
  identifyByValue: string
  attributes?: {
    [k: string]: unknown
  }
}
