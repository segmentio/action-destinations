export type State = string | { [k: string]: unknown } | undefined

export type Allocation = {
  group_id: string
  ordinal: string
  cid: string
  experiment_name: string | undefined
}

export type Event = {
  group_id: string
  ordinal: string
  cid: string
}

export type Evolv = {
  client: {
    emit: (event: string) => void
    on: (eventType: string, fn: () => void) => void
    getDisplayName: (key: string, eid: string) => string
  }
  context: {
    update: (data: State) => void
    get: (key: string) => { allocations: Allocation[] } | Event[]
  }
  setUid: (uid: string) => void
}

type User = {
  anonymousId: () => string
}
export type Analytics = {
  user: () => User
}
