import { SCHEMA_PROPERTIES } from './constants'
import { Payload } from './generated-types'

export type PayloadMap = Map<number, Payload> 

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
  EXTERN_ID: string,
  EMAIL: string,
  PHONE: string,
  DOBY: string,
  DOBM: string,
  DOBD: string,
  LN: string,
  FN: string,
  FI: string,
  GEN: string,
  CT: string,
  ST: string,
  ZIP: string,
  COUNTRY: string,
  MADID: string
]