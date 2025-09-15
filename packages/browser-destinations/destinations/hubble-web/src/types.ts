export type Methods = {
  track?: (...args: unknown[]) => unknown
  identify?: (...args: unknown[]) => unknown
}

export type Hubble = {
  id: string
  initialized: boolean
  setSource: (source: string) => void
} & Methods
