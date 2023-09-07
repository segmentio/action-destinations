interface Emitter {
  setSource: (source: string) => void
}

export type Methods = {
  track?: (...args: unknown[]) => unknown
  identify?: (...args: unknown[]) => unknown
}

export type Hubble = {
  id: string
  initialized: boolean
  _queue: unknown[]
  _emitter?: Emitter | null
} & Methods
