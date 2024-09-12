export type SubscriptionMetadata = {
  actionConfigId: string
}

export type SyncMode = 'upsert' | 'add' | 'update'

export type StringFormat = 'date' | 'datetime' | 'string'

export type SegmentPropertyType = 'number' | 'object' | 'boolean' | 'string'
export interface SegmentProperty {
  type: SegmentPropertyType
  stringFormat?: StringFormat
}

export const SchemaMatch = {
  FullMatch: 'full_match',
  PropertiesMissing: 'properties_missing',
  NoMatch: 'no_match',
  Mismatch: 'mismatch'
} as const

export type SchemaMatch = typeof SchemaMatch[keyof typeof SchemaMatch]

export interface SchemaDiff {
  match: SchemaMatch
  fullyQualifiedName?: string
  name?: string
  missingProperties: {
    [key: string]: SegmentProperty
  }
}

export interface Schema {
  eventName: string
  properties: {
    [key: string]: SegmentProperty
  }
  primaryObject: string
}

export type HubspotPropertyType = 'string' | 'number' | 'enumeration' | 'datetime'

export interface GetEventDefinitionResp {
  archived: boolean
  fullyQualifiedName: string
  name: string
  properties: Array<{
    archived: boolean
    name: string
    type: HubspotPropertyType
  }>
}

export interface CreateEventDefinitionResp {
  fullyQualifiedName: string
  name: string
  message: string
}

export interface CreatePropDefinitionReq {
  name: string
  label: string
  type: HubspotPropertyType
  description: string
  options?: Array<{
    label: string
    value: boolean
    description: string
    hidden: boolean
    displayOrder: number
  }>
}

export interface CreateEventDefinitionReq {
  label: string
  name: string
  description: string
  primaryObject: string
  propertyDefinitions: Array<CreatePropDefinitionReq>
}

export interface EventCompletionReq {
  eventName: string
  objectId?: number | undefined
  email?: string | undefined
  utk?: string | undefined
  occurredAt: string | number | undefined
  properties?: { [k: string]: unknown } | undefined
}
