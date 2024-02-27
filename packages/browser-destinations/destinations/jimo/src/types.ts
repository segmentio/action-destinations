export interface JimoSDK {
  push: (params: Array<string | (string | { [k: string]: unknown } | boolean)[]>) => Promise<void>
}
