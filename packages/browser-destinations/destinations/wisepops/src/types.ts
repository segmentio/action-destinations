type method = 'event' | 'goal' | 'options' | 'pageview' | 'properties'

type WisepopsFunction = (method: method, parameters?: unknown, options?: unknown) => void

type WisepopsInternal = {
  q: unknown[]
  l: number
}

export type Wisepops = WisepopsFunction & WisepopsInternal
