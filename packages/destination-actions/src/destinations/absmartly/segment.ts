export interface RequestData<Settings, Payload> {
  rawData: {
    timestamp: string
    type: string
    receivedAt: string
    sentAt: string
  }
  rawMapping: Record<string, unknown>
  settings: Settings
  payload: Payload
}
