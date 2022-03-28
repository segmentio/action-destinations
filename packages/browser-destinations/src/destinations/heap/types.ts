export type UserConfig = {
  disableTextCapture: boolean
  secureCookie: boolean
}

interface UserProperties {
  [k: string]: unknown
}

export interface HeapApi {
  appid: string
  track: (eventName: string, eventProperties: { [key: string]: unknown }, library: string) => void
  load: () => void
  config: UserConfig
  identify: (identity: string) => void
  addUserProperties: (properties: UserProperties) => void
}
