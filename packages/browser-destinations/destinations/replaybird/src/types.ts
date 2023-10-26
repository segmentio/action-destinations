type EventProperties = {
  [key: string]: unknown
}

export type ReplayBird = {
  apiKey: string
  capture: (eventName: string, eventProperties: EventProperties) => void
  identify: (identity: string, props: any) => void
  init: (apiKey: string, props: any) => void
}
