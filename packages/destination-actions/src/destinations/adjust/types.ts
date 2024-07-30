export interface AdjustPayload {
  app_token: string
  event_token: string
  environment: string
  s2s: number
  callback_params?: string
  created_at_unix?: number
}
