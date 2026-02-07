export interface AppcuesRequest {
  type: string
  userId?: string
  anonymousId?: string
  event?: string
  properties?: Record<string, any>
  traits?: Record<string, any>
  groupId?: string
  context?: Record<string, any>
  integrations?: Record<string, any>
  timestamp?: string
  messageId?: string
}
