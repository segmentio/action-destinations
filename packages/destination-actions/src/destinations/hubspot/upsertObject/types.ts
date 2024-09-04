import { Payload } from './generated-types'

export const SyncMode = {
  Upsert: 'upsert',
  Add: 'add',
  Update: 'update'
} as const

export type SyncMode = typeof SyncMode[keyof typeof SyncMode]

export const AssociationSyncMode = {
  Upsert: 'upsert',
  Read: 'read'
} as const

export type AssociationSyncMode = typeof AssociationSyncMode[keyof typeof AssociationSyncMode]

export const BatchRequestType = {
  Upsert: 'upsert',
  Create: 'create',
  Update: 'update',
  Read: 'read'
} as const

export type BatchRequestType = typeof BatchRequestType[keyof typeof BatchRequestType]

export const HSPropTypeFieldType = {
  StringText: 'string:text',
  NumberNumber: 'number:number',
  DateTimeDate: 'datetime:date',
  DateDate: 'date:date',
  EnumerationBooleanCheckbox: 'enumeration:booleancheckbox'
} as const

export type HSPropTypeFieldType = typeof HSPropTypeFieldType[keyof typeof HSPropTypeFieldType]

export const HSPropType = {
  Date: 'date',
  String: 'string',
  DateTime: 'datetime',
  Number: 'number',
  Enumeration: 'enumeration'
} as const

export type HSPropType = typeof HSPropType[keyof typeof HSPropType]

export const HSPropFieldType = {
  Text: 'text',
  Number: 'number',
  Date: 'date',
  BooleanCheckbox: 'booleancheckbox',
  Select: 'select'
} as const

export type HSPropFieldType = typeof HSPropFieldType[keyof typeof HSPropFieldType]

export const SchemaMatch = {
  FullMatch: 'full_match',
  PropertiesMissing: 'properties_missing',
  NoMatch: 'no_match',
  Mismatch: 'mismatch'
} as const

export type SchemaMatch = typeof SchemaMatch[keyof typeof SchemaMatch]

export const ReadType = {
  ReturnRecordsWithIds: 'return_records_with_ids',
  ReturnRecordsWithoutIds: 'return_records_without_ids'
} as const

export type ReadType = typeof ReadType[keyof typeof ReadType]

export interface Prop {
  name: string
  type: HSPropType
  fieldType: HSPropFieldType
  typeFieldType: HSPropTypeFieldType
}

export interface Schema {
  object_details: {
    object_type: string
    id_field_name: string
  }
  properties: Prop[]
  sensitiveProperties: Prop[]
}

export interface SchemaDiff {
  match: SchemaMatch
  object_details: {
    object_type: string
    id_field_name: string
  }
  missingProperties: Prop[]
  missingSensitiveProperties: Prop[]
}

export interface ResponseType {
  status: 'fulfilled' | 'rejected'
  value?: { data: { results: Result[] } }
  reason?: { message: string }
}

export interface Result {
  name: string
  type: HSPropType
  fieldType: HSPropFieldType
  hasUniqueValue: boolean
}

export interface ReadJSON {
  idProperty: string
  properties: string[]
  inputs: Array<{ id: string }>
}

export interface UpsertJSON {
  inputs: Array<{
    idProperty: string
    id: string
    properties: Record<string, string>
  }>
}

export interface CreateJSON {
  inputs: Array<{
    idProperty: string
    properties: Record<string, string>
  }>
}

export interface RespJSON {
  status: string
  results: Array<{
    id: string
    properties: Record<string, string | null>
  }>
}

interface OmitPayload extends Omit<Payload, 'enable_batching' | 'batch_size' | 'association_sync_mode'> {}

export interface PayloadWithFromId extends OmitPayload {
  object_details: OmitPayload['object_details'] & {
    record_id: string
  }
  associations?: Array<{
    object_type: string
    association_label: string
    id_field_name: string
    id_field_value: string
    from_record_id: string
  }>
}

export interface AssociationPayload extends OmitPayload {
  object_details: OmitPayload['object_details'] & {
    from_record_id: string
  }
  association_details: {
    association_label: string
  }
}

export interface AssociationPayloadWithId extends AssociationPayload {
  object_details: AssociationPayload['object_details'] & {
    record_id: string
  }
}

export interface AssociationType {
  associationCategory: AssociationCategory
  associationTypeId: string
}

enum AssociationCategory {
  HUBSPOT_DEFINED = 'HUBSPOT_DEFINED',
  USER_DEFINED = 'USER_DEFINED',
  INTEGRATOR_DEFINED = 'INTEGRATOR_DEFINED'
}

export interface BatchAssociationsRequestBody {
  inputs: {
    types: AssociationType[]
    from: {
      id: string
    }
    to: {
      id: string
    }
  }[]
}

export interface GroupableFields {
  object_type: string
  id_field_name: string
}

export interface CreatePropsDefinitionReq {
  inputs: Array<Input>
}

export interface Input {
  name: string
  label: string
  groupName: string
  type: string
  dataSensitivity: 'sensitive' | undefined
  fieldType: string
  options?: Array<{ label: string; value: string; hidden: boolean; description: string; displayOrder: number }>
}
