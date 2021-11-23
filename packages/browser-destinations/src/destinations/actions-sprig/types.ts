export interface Sprig {
  (...args: unknown[]): unknown // TODO revisit
  envId?: string
  _queue?: unknown[]
}
