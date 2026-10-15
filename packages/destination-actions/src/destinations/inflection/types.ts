export type FlatValue = string | number | boolean

export type FlatRecord = Record<string, FlatValue>

export interface NestedValueOptions {
  objects?: string
  arrays?: string
}

interface BaseJSON {
  messageId: string
  timestamp: string | number
  anonymousId?: string
}

export interface TrackJSON extends BaseJSON {
  type: 'track'
  userId: string
  event: string
  properties?: FlatRecord
  context?: {
    groupId: string
  }
}

export interface IdentifyJSON extends BaseJSON {
  type: 'identify'
  userId: string
  traits: FlatRecord & { email: string }
}

export interface GroupJSON extends BaseJSON {
  type: 'group'
  userId: string
  groupId: string
  traits?: FlatRecord
}

export type InflectionJSON = TrackJSON | IdentifyJSON | GroupJSON
