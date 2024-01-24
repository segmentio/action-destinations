export type EventType = 'track' | 'identify' | 'page' | 'screen'

export const submitEventUrl = (env: string, eventType: EventType): string =>
  `https://${env}.saleswings.pro/api/segment/events/${eventType}`
export const submitEventBatchUrl = (env: string, eventType: EventType): string =>
  `https://${env}.saleswings.pro/api/segment/events/${eventType}/batches`
export const getAccountUrl = (env: string): string => `https://${env}.saleswings.pro/api/core/project/account`
