export interface JimoSDK {
  push: (params: Array<string | string[]>) => Promise<void>
}
