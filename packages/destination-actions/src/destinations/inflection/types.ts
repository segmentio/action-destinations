import type { Payload as IdentifyPayload } from './identify/generated-types'
import type { Payload as TrackPayload } from './track/generated-types'

export type FlatValue = string | number | boolean

export type FlatRecord = Record<string, FlatValue>

export interface NestedValueOptions {
  objects?: string
  arrays?: string
}

export type TraitsOrProperties = IdentifyPayload['traits'] | TrackPayload['properties']

export type MaybeAudiencePayload = IdentifyPayload | TrackPayload

export type Audience = Required<NonNullable<MaybeAudiencePayload['audienceDetails']>>

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
