export type Event = string | { [k: string]: unknown } | undefined

export type State = string | { [k: string]: unknown } | undefined

export type Evolv = {
  client: {
    emit: (args: Event) => void
  }
  context: {
    setValue: (args: State) => void
  }
}
