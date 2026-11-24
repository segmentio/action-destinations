export interface IdentifyJSON {
  id?: string
  email?: string
  channels?: { type: 'push'; address: string; platform: 'ios' | 'android' }[]
  data?: Record<string, string> & { timezone?: number }
  extras?: { created_at?: string; update_only?: 'true' }
  preferences?: {
    topics: (
      | { id: number; name?: never; status: 'subscribed' | 'unsubscribed' }
      | { name: string; id?: never; status: 'subscribed' | 'unsubscribed' }
    )[]
  }
}
