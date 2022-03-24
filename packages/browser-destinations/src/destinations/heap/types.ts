export type UserConfig = {
  disableTextCapture: boolean
  secureCookie: boolean
}

export interface HeapApi {
  appid: string
  track: (eventName: string, eventProperties: { [key: string]: unknown }, library: string) => void
  load: Function
  config: UserConfig
  identify: (identity: string) => void
}
