// type UserConfig = {
//   disableTextCapture: boolean;
//   secureCookie: boolean;
//   trackingServer: string;
// };

export interface HeapApi extends Array<unknown> {
  appid: string
  // config: UserConfig
}
