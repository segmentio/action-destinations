import { SCHEMA_PROPERTIES } from './constants'

export type SyncMode = 'mirror' | 'upsert' | 'delete'
export interface GetAllAudienceResponse {
  data: {
    id: string
    name: string
  }[]
}

export interface AudienceJSON {
  payload: {
    schema: typeof SCHEMA_PROPERTIES
    data: FacebookDataRow[]
    app_ids?: string[]
    page_ids?: string[]
    ig_account_ids?: string[]
  }
}

export type FacebookDataRow = [
  string, // EXTERN_ID (externalId)
  string, // EMAIL
  string, // PHONE
  string, // DOBY (year)
  string, // DOBM (month)
  string, // DOBD (day)
  string, // LN (last)
  string, // FN (first)
  string, // FI (firstInitial)
  string, // GEN (gender) 
  string, // CT (city)
  string, // ST (state)
  string, // ZIP
  string,  // COUNTRY
  string // MADID (mobileAdId)
]