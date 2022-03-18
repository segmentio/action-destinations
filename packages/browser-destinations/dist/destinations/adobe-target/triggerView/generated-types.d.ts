export interface Payload {
  viewName: string
  pageParameters?: {
    [k: string]: unknown
  }
  sendNotification?: boolean
  userId?: string
}
