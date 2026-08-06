export interface FakeClient {
  apiKey: string
  endpoint: string
  track: (event: string, properties?: Record<string, unknown>) => void
}
