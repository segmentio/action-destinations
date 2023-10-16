type EventProperties = {
  [key: string]: unknown
}

export type ReplayBird = {
  capture: (eventName: string, eventProperties: EventProperties, library?: string) => void
  identify: (identity: string, props: any) => void
  init: (siteKey: string, props: any) => void
}
