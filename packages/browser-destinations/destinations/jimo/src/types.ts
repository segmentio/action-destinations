export interface JimoSDK {
  push: (params: Array<string | (string | { [k: string]: unknown } | boolean | Function)[]>) => Promise<void>
  jimoInit: () => void
}
