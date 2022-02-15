
type UserConfig = {
  disableTextCapture: boolean;
  secureCookie: boolean;
  trackingServer: string;
};

export interface Heap extends Array<unknown> {
  load: () => void
  appid: string
  config: UserConfig
}
