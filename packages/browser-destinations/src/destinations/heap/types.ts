export type UserConfig = {
  disableTextCapture: boolean
  secureCookie: boolean
}

export interface HeapApi {
  appid: string
  track: Function
  load: Function
  config: UserConfig
  identify: Function
}
