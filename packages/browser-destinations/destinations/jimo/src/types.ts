export interface JimoSDK {
  push: (params: Array<string | (string | { [k: string]: unknown } | boolean | Function)[]>) => Promise<void>
}

export interface JimoClient {
  initialized: boolean
  client: () => JimoSDK | any[]
}
