export type UserConfig = {
  trackingServer?: string
  disableTextCapture: boolean
  secureCookie: boolean
}

type UserProperties = {
  [k: string]: unknown
}

type EventProperties = {
  [key: string]: unknown
}

export type HeapApi = {
  appid: string
  track: (eventName: string, eventProperties: EventProperties, library?: string) => void
  load: () => void
  config: UserConfig
  identify: (identity: string) => void
  addUserProperties: (properties: UserProperties) => void
}
