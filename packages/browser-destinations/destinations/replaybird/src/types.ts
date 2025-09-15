type EventProperties = {
  [key: string]: unknown
}

type UserProperties = {
  [k: string]: unknown
}

export type ReplayBird = {
  apiKey: string
  capture: (eventName: string, eventProperties: EventProperties) => void
  identify: (userId: string, traits: UserProperties) => void
  init: (apiKey: string, options: object) => void
}
