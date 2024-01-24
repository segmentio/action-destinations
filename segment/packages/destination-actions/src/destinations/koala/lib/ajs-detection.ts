export interface AnalyticsEventContext {
  library?: {
    name?: string
  }
}

export function isAJSEvent(eventContext?: AnalyticsEventContext): boolean {
  return eventContext?.library?.name === 'analytics.js'
}
