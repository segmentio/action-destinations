export interface TrackJSON {
  identity: { id?: string; email?: string }
  event_name: string
  data?: Record<string, string>
  extras?: { source?: string; created_at?: string }
}
