export interface CustomEvent {
  type: string
  properties?: Record<string, unknown>
  externalEventId?: string
  occurredAt?: string
  user: User
}

export interface User {
  phone?: string
  email?: string
  externalIdentifiers?: {
    clientUserId?: string
    [key: string]: string | undefined
  }
}
