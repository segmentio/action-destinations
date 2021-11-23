export interface Sprig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): any // TODO revisit
  envId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _queue?: any[]
}
