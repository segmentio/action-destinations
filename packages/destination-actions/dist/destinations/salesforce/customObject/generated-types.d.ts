export interface Payload {
  operation: string
  traits?: {
    [k: string]: unknown
  }
  customObjectName: string
  customFields: {
    [k: string]: unknown
  }
}
