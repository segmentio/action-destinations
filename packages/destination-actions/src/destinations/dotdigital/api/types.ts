export interface DynamicFieldResponse {
  choices: Array<{ value: number; label: string }>
  nextPage?: string
  error?: {
    message: string
    code: string
  }
}

export interface List {
  id: number
  name: string
  status: string
}
export interface DataField {
  name: string
  type: string
  visibility: string
  defaultValue: string | null
}

export type DataFieldType = 'string' | 'number' | 'datetime' | 'boolean'

export interface Identifiers {
  email?: string
  mobileNumber?: string
}

interface DataFields {
  [key: string]: string | number | boolean | null
}

export interface ChannelProperties {
  email?: {
    status: string
    emailType: string
    optInType: string
  }
  sms?: {
    status: string
  }
}

interface ConsentRecord {
  text: string
  dateTimeConsented: string
  url: string
  ipAddress: string
  userAgent: string
}

export interface Contact {
  contactId: number
  status: string
  created: string
  updated: string
  identifiers: Identifiers
  dataFields: DataFields
  channelProperties: ChannelProperties
  lists: List[]
  consentRecords: ConsentRecord[]
}

export enum ProgramStatus {
  Active = 'Active',
  Draft = 'Draft',
  Deactivated = 'Deactivated'
}

export interface Program {
  id: number
  name: string
  status: ProgramStatus
  dateCreated: string // ISO date string
}

export interface ProgramEnrolment {
  id: string
  programId: number
  status: string
  dateCreated: string
  contacts: null | unknown
  addressBooks: null | unknown
}

export type ChannelIdentifier = { email: string; 'mobile-number'?: never } | { 'mobile-number': string; email?: never }
