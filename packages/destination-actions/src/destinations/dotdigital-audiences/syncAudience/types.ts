
export interface Contact {
  contactId: number
  status: string
  created: string
  updated: string
  identifiers: Identifiers
  dataFields: DataFields
  channelProperties: ChannelProperties
  lists: List[]
}
export interface List {
  id: number
  name: string
  status: string
}

export interface UpsertContactJSON {
  identifiers: Identifiers
  channelProperties: ChannelProperties
  lists: number[]
  dataFields?: DataFields
}

export interface Identifiers {
  email?: string
  mobileNumber?: string
}

export interface DataFields {
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

