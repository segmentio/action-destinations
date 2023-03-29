export interface ProjectConfig {
  revision: string
  projectId: string
  sdkKey: string
  environmentKey: string
  sendFlagDecisions?: boolean
  events: Event[]
  attributes: Array<{ id: string; key: string }>
  anonymizeIP?: boolean | null
  botFiltering?: boolean
  accountId: string
  publicKeyForOdp?: string
  hostForOdp?: string
  allSegments: Set<string>
}

export interface Event {
  key: string
  id: string
  experimentsIds: string[]
}

export interface VisitorAttribute {
  entity_id: string
  key: string
  type: string
  value: string | number | boolean
}

export interface dataFile {
  events: Event[]
  attributes: Array<{ id: string; key: string }>
  anonymizeIP?: boolean | null
  botFiltering?: boolean
  accountId: string
}
